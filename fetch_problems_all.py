import json
import os
import random
import tempfile
import time

import certifi
import urllib3
from dotenv import dotenv_values

config = {
    **dotenv_values(".env"),
    **dotenv_values(".env.local"),
    **os.environ,
}

PAGE_SIZE = 100
RETRY_COUNT = 5
REQUEST_TIMEOUT = urllib3.Timeout(connect=10.0, read=30.0)
REQUIRED_FIELDS = ('frontendQuestionId', 'titleSlug')
PROBLEMS_PATH = 'problems_all.json'


def create_http():
    # Python.org macOS installs often have no cert.pem; pin a known CA bundle.
    return urllib3.PoolManager(
        cert_reqs='CERT_REQUIRED',
        ca_certs=certifi.where(),
        timeout=REQUEST_TIMEOUT,
    )


def fetch_problems_page(http, cf_clearance, csrftoken, limit=PAGE_SIZE, skip=0):
    cookie = 'cf_clearance=%s; csrftoken=%s' % (cf_clearance, csrftoken)
    data = {
        'query': '''
            query problemsetQuestionList(
                $categorySlug:String,
                $limit:Int,
                $skip:Int,
                $filters:QuestionListFilterInput
            ) {
                problemsetQuestionList:questionList(
                    categorySlug:$categorySlug 
                    limit:$limit 
                    skip:$skip 
                    filters:$filters
                ) {
                    total:totalNum 
                    questions:data {
                        acRate 
                        difficulty 
                        likes
                        dislikes
                        stats
                        categoryTitle
                        frontendQuestionId:questionFrontendId 
                        paidOnly:isPaidOnly 
                        title 
                        titleSlug 
                        topicTags {
                            name 
                            id 
                            slug
                        }
                        hasSolution 
                        hasVideoSolution
                    }
                }
            }
        ''',
        'variables': {
            'categorySlug': '',
            'skip': skip,
            'limit': limit,
            'filters': {},
        },
    }
    encoded_data = json.dumps(data).encode('utf-8')
    last_status = None
    last_error = None
    for trial in range(1, RETRY_COUNT + 1):
        try:
            response = http.request(
                'POST',
                'https://leetcode.com/graphql/',
                body=encoded_data,
                headers={
                    'Content-Type': 'application/json',
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                    'X-Csrftoken': csrftoken,
                },
            )
        except urllib3.exceptions.HTTPError as exc:
            last_error = type(exc).__name__
            if trial < RETRY_COUNT:
                print('Network error %s when fetch problems, will retry %d second(s) later...' % (
                    last_error, trial ** 2))
                time.sleep(trial ** 2)
                continue
            raise RuntimeError(
                'Fail to fetch problems! skip: %d, error: %s' % (skip, last_error)
            ) from exc
        last_status = response.status
        if response.status == 200:
            try:
                return json.loads(response.data)
            except json.JSONDecodeError as exc:
                raise RuntimeError(
                    'Fail to fetch problems! skip: %d, error: invalid JSON' % skip
                ) from exc
        if trial < RETRY_COUNT:
            print('Status %d got when fetch problems, will retry %d second(s) later...' % (
                response.status, trial ** 2))
            time.sleep(trial ** 2)
    if last_error:
        raise RuntimeError('Fail to fetch problems! skip: %d, error: %s' % (skip, last_error))
    raise RuntimeError('Fail to fetch problems! status: %d, skip: %d' % (last_status, skip))


def fetch_all_problems(http, cf_clearance, csrftoken):
    first_page = fetch_problems_page(http, cf_clearance, csrftoken, limit=PAGE_SIZE, skip=0)
    try:
        total_count = first_page['data']['problemsetQuestionList']['total']
        all_questions = list(first_page['data']['problemsetQuestionList']['questions'])
    except (KeyError, TypeError) as exc:
        raise RuntimeError('Fail to parse problems page! skip: 0') from exc
    print('Fetched page 1: %d/%d problems' % (len(all_questions), total_count))

    skip = PAGE_SIZE
    while skip < total_count:
        page = fetch_problems_page(http, cf_clearance, csrftoken, limit=PAGE_SIZE, skip=skip)
        try:
            questions = page['data']['problemsetQuestionList']['questions']
        except (KeyError, TypeError) as exc:
            raise RuntimeError('Fail to parse problems page! skip: %d' % skip) from exc
        all_questions.extend(questions)
        print('Fetched page %d: %d/%d problems' % (
            skip // PAGE_SIZE + 1, len(all_questions), total_count))
        skip += PAGE_SIZE
        time.sleep(0.5 + random.random())

    return all_questions, total_count


def validate_snapshot(questions, expected_total):
    if not isinstance(expected_total, int) or expected_total <= 0:
        raise RuntimeError('Upstream total is missing or invalid')
    if not isinstance(questions, list):
        raise RuntimeError('Fetched problems payload is not a list')
    if len(questions) != expected_total:
        raise RuntimeError(
            'Fetched problem count %d does not match upstream total %d'
            % (len(questions), expected_total)
        )

    indexed = {}
    for index, question in enumerate(questions):
        if not isinstance(question, dict):
            raise RuntimeError('Problem at index %d is not an object' % index)
        missing = [field for field in REQUIRED_FIELDS if not question.get(field)]
        if missing:
            raise RuntimeError(
                'Problem at index %d missing required fields: %s'
                % (index, ', '.join(missing))
            )
        question_id = str(question['frontendQuestionId'])
        if question_id in indexed:
            raise RuntimeError('Fetched problems contain duplicate question id %s' % question_id)
        indexed[question_id] = question
    return indexed


def enrich_question_stats(questions_all):
    for question in questions_all.values():
        total_accepted_raw = total_submission_raw = None
        try:
            question_stats = json.loads(question['stats'])
            total_accepted_raw = question_stats['totalAcceptedRaw']
            total_submission_raw = question_stats['totalSubmissionRaw']
        except (KeyError, TypeError, json.JSONDecodeError):
            pass
        question['totalAcceptedRaw'] = total_accepted_raw
        question['totalSubmissionRaw'] = total_submission_raw
        question.pop('stats', None)
    return questions_all


def atomic_write_json(path, payload):
    directory = os.path.dirname(os.path.abspath(path))
    fd, tmp_path = tempfile.mkstemp(prefix='problems_all.', suffix='.tmp', dir=directory)
    try:
        with os.fdopen(fd, 'w') as handle:
            json.dump(payload, handle)
        os.replace(tmp_path, path)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def load_credentials():
    print('Now load Cloudflare and CSRF credentials...')
    cf_clearance = config.get('LC_CF_CLEARANCE')
    csrftoken = config.get('LC_CSRFTOKEN')
    if not cf_clearance or not csrftoken:
        raise RuntimeError('Fail to load Cloudflare and CSRF credentials from environment!')
    print('Loaded Cloudflare and CSRF credentials.')
    return cf_clearance, csrftoken


def main():
    cf_clearance, csrftoken = load_credentials()
    print('Now fetching all LeetCode problems (paginated, %d per page)...' % PAGE_SIZE)
    all_questions, total_count = fetch_all_problems(create_http(), cf_clearance, csrftoken)
    questions_all = enrich_question_stats(validate_snapshot(all_questions, total_count))
    print('All %d problems fetched.' % len(questions_all))
    atomic_write_json(PROBLEMS_PATH, questions_all)
    print('All %d problems info saved into %s file.' % (len(questions_all), PROBLEMS_PATH))


if __name__ == '__main__':
    main()
