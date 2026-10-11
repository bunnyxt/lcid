const assert = require('node:assert/strict');
const { test } = require('node:test');
const handler = require('../api/problem');
const problems = require('../problems_all.json');

function call(query) {
  const headers = {};
  let body;
  const response = {
    statusCode: 200,
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    end(value) { body = value; },
  };
  handler({ query }, response);
  return { status: response.statusCode, headers, body };
}

test('global and China redirects retain the Flask route contract', () => {
  assert.deepEqual(call({ problem_id: '1' }), {
    status: 302,
    headers: { location: 'https://leetcode.com/problems/two-sum/' },
    body: undefined,
  });
  assert.equal(call({ problem_id: '1', mode: 'cn' }).headers.location,
    'https://leetcode.cn/problems/two-sum/');
  assert.equal(call({ problem_id: '999999' }).status, 404);
});

test('individual info and missing-id errors retain the Flask route contract', () => {
  const found = call({ problem_id: '1', mode: 'info' });
  assert.equal(found.status, 200);
  assert.equal(found.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(found.body), problems['1']);

  const missing = call({ problem_id: '999999', mode: 'info' });
  assert.equal(missing.status, 404);
  assert.deepEqual(JSON.parse(missing.body), {
    code: 404,
    message: 'Fail to get info of leetcode problem 999999.',
  });
});
