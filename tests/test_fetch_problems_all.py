import io
import json
import os
import tempfile
import unittest
from unittest import mock

import certifi
import urllib3

import fetch_problems_all as fetch


def _question(question_id='1', title_slug='two-sum', **extra):
    payload = {
        'frontendQuestionId': question_id,
        'titleSlug': title_slug,
        'title': extra.pop('title', 'Two Sum'),
        'stats': extra.pop('stats', json.dumps({
            'totalAcceptedRaw': 1,
            'totalSubmissionRaw': 2,
        })),
    }
    payload.update(extra)
    return payload


class ValidateSnapshotTestCase(unittest.TestCase):
    def test_indexes_valid_questions(self):
        questions = [_question('1'), _question('2', 'add-two-numbers')]

        indexed = fetch.validate_snapshot(questions, 2)

        self.assertEqual(list(indexed), ['1', '2'])
        self.assertEqual(indexed['2']['titleSlug'], 'add-two-numbers')

    def test_rejects_count_mismatch(self):
        with self.assertRaisesRegex(RuntimeError, 'does not match upstream total'):
            fetch.validate_snapshot([_question()], 2)

    def test_rejects_duplicate_ids(self):
        with self.assertRaisesRegex(RuntimeError, 'duplicate question id 1'):
            fetch.validate_snapshot([_question('1'), _question('1', 'other')], 2)

    def test_rejects_missing_required_fields(self):
        with self.assertRaisesRegex(RuntimeError, 'missing required fields: titleSlug'):
            fetch.validate_snapshot([_question(title_slug='')], 1)


class AtomicWriteTestCase(unittest.TestCase):
    def test_replaces_file_only_after_successful_write(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            path = os.path.join(temp_dir, 'problems_all.json')
            with open(path, 'w') as handle:
                handle.write('{"keep": true}')

            fetch.atomic_write_json(path, {'1': {'titleSlug': 'two-sum'}})

            with open(path) as handle:
                self.assertEqual(json.load(handle), {'1': {'titleSlug': 'two-sum'}})

    def test_failed_validation_leaves_existing_file(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            path = os.path.join(temp_dir, 'problems_all.json')
            with open(path, 'w') as handle:
                handle.write('{"keep": true}')

            with self.assertRaises(RuntimeError):
                fetch.validate_snapshot([_question()], 2)
                fetch.atomic_write_json(path, {})

            with open(path) as handle:
                self.assertEqual(handle.read(), '{"keep": true}')


class HttpClientTestCase(unittest.TestCase):
    def test_uses_certifi_bundle_and_required_certs(self):
        http = fetch.create_http()

        self.assertEqual(http.connection_pool_kw['cert_reqs'], 'CERT_REQUIRED')
        self.assertEqual(http.connection_pool_kw['ca_certs'], certifi.where())
        self.assertEqual(http.connection_pool_kw['timeout'], fetch.REQUEST_TIMEOUT)

    def test_does_not_disable_tls_warnings(self):
        source_path = os.path.abspath(fetch.__file__)
        with open(source_path) as handle:
            source = handle.read()

        self.assertNotIn('CERT_NONE', source)
        self.assertNotIn('disable_warnings', source)
        self.assertNotIn('InsecureRequestWarning', source)

    def test_request_errors_omit_credentials_and_body(self):
        http = mock.Mock()
        http.request.return_value = mock.Mock(
            status=403,
            data=b'cf_clearance=secret-token; csrftoken=other-secret',
        )

        with mock.patch.object(fetch.time, 'sleep'):
            with self.assertRaises(RuntimeError) as ctx:
                fetch.fetch_problems_page(
                    http,
                    'secret-clearance',
                    'secret-csrf',
                    skip=200,
                )

        message = str(ctx.exception)
        self.assertIn('status: 403', message)
        self.assertIn('skip: 200', message)
        self.assertNotIn('secret-clearance', message)
        self.assertNotIn('secret-csrf', message)
        self.assertNotIn('secret-token', message)
        self.assertNotIn('other-secret', message)

    def test_timeout_is_urllib3_timeout(self):
        self.assertIsInstance(fetch.REQUEST_TIMEOUT, urllib3.Timeout)
        self.assertEqual(fetch.REQUEST_TIMEOUT.connect_timeout, 10.0)
        self.assertEqual(fetch.REQUEST_TIMEOUT.read_timeout, 30.0)


class CredentialLogTestCase(unittest.TestCase):
    def test_load_credentials_does_not_print_secrets(self):
        with mock.patch.dict(fetch.config, {
            'LC_CF_CLEARANCE': 'secret-clearance',
            'LC_CSRFTOKEN': 'secret-csrf',
        }):
            stdout = io.StringIO()
            with mock.patch('sys.stdout', stdout):
                clearance, csrf = fetch.load_credentials()

        logs = stdout.getvalue()
        self.assertEqual(clearance, 'secret-clearance')
        self.assertEqual(csrf, 'secret-csrf')
        self.assertNotIn('secret-clearance', logs)
        self.assertNotIn('secret-csrf', logs)
        self.assertIn('Loaded Cloudflare and CSRF credentials.', logs)


class EnrichStatsTestCase(unittest.TestCase):
    def test_promotes_stats_and_drops_raw_field(self):
        questions = fetch.enrich_question_stats({
            '1': _question(),
        })

        self.assertEqual(questions['1']['totalAcceptedRaw'], 1)
        self.assertEqual(questions['1']['totalSubmissionRaw'], 2)
        self.assertNotIn('stats', questions['1'])


if __name__ == '__main__':
    unittest.main()
