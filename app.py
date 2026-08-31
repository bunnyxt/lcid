import sys
from flask import Flask, jsonify, redirect, request
from flask_cors import CORS
from flask_compress import Compress
from waitress import serve
import json
import re

app = Flask(__name__, static_url_path='', static_folder='build')
Compress(app)
CORS(app)

HASHED_ASSET_RE = re.compile(r'^/assets/.+[-.][A-Za-z0-9_-]{8,}\.(?:css|js)$')


@app.after_request
def cache_hashed_assets(response):
    if response.status_code == 200 and HASHED_ASSET_RE.match(request.path):
        response.cache_control.no_cache = None
        response.cache_control.public = True
        response.cache_control.max_age = 31536000
        response.cache_control.immutable = True
    return response

# load problems
with open('problems_all.json', 'r') as f:
    problems_all_json = f.read()
    problems_all = json.loads(problems_all_json)


@app.route('/')
def root():
    return app.send_static_file('index.html')


@app.route('/manifest.json')
def static_manifest():
    return app.send_static_file('manifest.json')


@app.route('/lcid_logo_192.png')
def static_logo_192():
    return app.send_static_file('lcid_logo_192.png')


@app.route('/lcid_logo_512.png')
def static_logo_512():
    return app.send_static_file('lcid_logo_512.png')


@app.route('/favicon.ico')
def static_favicon():
    return app.send_static_file('favicon.ico')


@app.route('/robots.txt')
def static_robots():
    return app.send_static_file('robots.txt')


@app.route('/<problem_id>')
def go_redirect(problem_id):
    problem_info = problems_all.get(problem_id, None)
    if not problem_info:
        return 'Fail to redirect to leetcode problem %s page.' % problem_id, 404
    return redirect('https://leetcode.com/problems/%s/' % problem_info['titleSlug'])


@app.route('/cn/<problem_id>')
def go_redirect_cn(problem_id):
    problem_info = problems_all.get(problem_id, None)
    if not problem_info:
        return 'Fail to redirect to leetcode.cn problem %s page.' % problem_id, 404
    return redirect('https://leetcode.cn/problems/%s/' % problem_info['titleSlug'])


@app.route('/info')
def info_all():
    return jsonify(problems_all)


@app.route('/info/<problem_id>')
def info(problem_id):
    problem_info = problems_all.get(problem_id, None)
    if not problem_info:
        return jsonify(
            code=404,
            message='Fail to get info of leetcode problem %s.' % problem_id,
        ), 404
    return jsonify(problem_info)


if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=sys.argv[1])
