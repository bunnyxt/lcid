import unittest

from app import app, cache_hashed_assets, problems_all


class AppRoutesTestCase(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_info_all_returns_json(self):
        response = self.client.get('/info')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertIn('1', response.get_json())

    def test_info_returns_problem_json(self):
        response = self.client.get('/info/1')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertEqual(response.get_json(), problems_all['1'])

    def test_info_returns_json_404_for_unknown_problem(self):
        response = self.client.get('/info/999999')

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.mimetype, 'application/json')
        self.assertEqual(response.get_json(), {
            'code': 404,
            'message': 'Fail to get info of leetcode problem 999999.',
        })

    def test_china_redirect_uses_current_domain(self):
        response = self.client.get('/cn/1')

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response.headers['Location'],
            'https://leetcode.cn/problems/two-sum/',
        )

    def test_china_redirect_returns_404_for_unknown_problem(self):
        response = self.client.get('/cn/999999')

        self.assertEqual(response.status_code, 404)

    def test_hashed_assets_use_immutable_cache(self):
        with app.test_request_context('/assets/index-ABCDEFGH.js'):
            response = cache_hashed_assets(app.response_class(status=200))

        self.assertIn('public', response.headers['Cache-Control'])
        self.assertIn('max-age=31536000', response.headers['Cache-Control'])
        self.assertIn('immutable', response.headers['Cache-Control'])
        self.assertNotIn('no-cache', response.headers['Cache-Control'])

    def test_index_is_not_immutable(self):
        with app.test_request_context('/'):
            response = cache_hashed_assets(app.response_class(status=200))

        self.assertNotIn('immutable', response.headers.get('Cache-Control', ''))


if __name__ == '__main__':
    unittest.main()
