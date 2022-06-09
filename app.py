import sys
from flask import Flask, redirect
from flask_cors import CORS
from waitress import serve
import json

app = Flask(__name__, static_url_path='', static_folder='build')
CORS(app)

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
        return 'Fail to redirect to leetcode problem %s page.' % problem_id
    return redirect('https://leetcode.com/problems/%s/' % problem_info['titleSlug'])


@app.route('/cn/<problem_id>')
def go_redirect_cn(problem_id):
    problem_info = problems_all.get(problem_id, None)
    if not problem_info:
        return 'Fail to redirect to leetcode-cn problem %s page.' % problem_id
    return redirect('https://leetcode-cn.com/problems/%s/' % problem_info['titleSlug'])


@app.route('/info')
def info_all():
    return json.dumps(problems_all)


@app.route('/info/<problem_id>')
def info(problem_id):
    problem_info = problems_all.get(problem_id, None)
    if not problem_info:
        return '{"code":404,"message":"Fail to get info of leetcode problem %s."}' % problem_id, 404
    return json.dumps(problems_all[problem_id])


if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=sys.argv[1])
