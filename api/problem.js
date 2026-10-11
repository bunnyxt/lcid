const problems = require('../problems_all.json');

module.exports = function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', '*');

  if (request.method === 'OPTIONS') {
    response.statusCode = 200;
    response.end();
    return;
  }

  const { problem_id: problemId, mode } = request.query;
  const problem = typeof problemId === 'string' && Object.hasOwn(problems, problemId)
    ? problems[problemId]
    : null;

  if (mode === 'info') {
    response.setHeader('Content-Type', 'application/json');
    if (!problem) {
      response.statusCode = 404;
      response.end(JSON.stringify({
        code: 404,
        message: `Fail to get info of leetcode problem ${problemId}.`,
      }));
      return;
    }
    response.end(JSON.stringify(problem));
    return;
  }

  if (!problem) {
    response.statusCode = 404;
    response.end(`Fail to redirect to leetcode problem ${problemId} page.`);
    return;
  }

  const site = mode === 'cn' ? 'leetcode.cn' : 'leetcode.com';
  response.statusCode = 302;
  response.setHeader('Location', `https://${site}/problems/${problem.titleSlug}/`);
  response.end();
};
