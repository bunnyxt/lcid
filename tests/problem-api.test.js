const assert = require('node:assert/strict');
const { test } = require('node:test');
const handler = require('../api/problem');
const problems = require('../problems_all.json');

function call(query, method = 'GET') {
  const headers = {};
  let body;
  const response = {
    statusCode: 200,
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    end(value) { body = value; },
  };
  handler({ query, method }, response);
  return { status: response.statusCode, headers, body };
}

test('global and China redirects retain the Flask route contract', () => {
  const redirect = call({ problem_id: '1' });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.location, 'https://leetcode.com/problems/two-sum/');
  assert.equal(redirect.headers['access-control-allow-origin'], '*');
  assert.equal(redirect.body, undefined);
  assert.equal(call({ problem_id: '1', mode: 'cn' }).headers.location,
    'https://leetcode.cn/problems/two-sum/');
  assert.equal(call({ problem_id: '999999' }).status, 404);
});

test('individual info and missing-id errors retain the Flask route contract', () => {
  const found = call({ problem_id: '1', mode: 'info' });
  assert.equal(found.status, 200);
  assert.equal(found.headers['content-type'], 'application/json');
  assert.equal(found.headers['access-control-allow-origin'], '*');
  assert.deepEqual(JSON.parse(found.body), problems['1']);

  const missing = call({ problem_id: '999999', mode: 'info' });
  assert.equal(missing.status, 404);
  assert.equal(missing.headers['access-control-allow-origin'], '*');
  assert.deepEqual(JSON.parse(missing.body), {
    code: 404,
    message: 'Fail to get info of leetcode problem 999999.',
  });
});

test('preflight requests preserve cross-origin access', () => {
  const response = call({ problem_id: '1', mode: 'info' }, 'OPTIONS');
  assert.equal(response.status, 200);
  assert.equal(response.headers['access-control-allow-origin'], '*');
  assert.equal(response.headers['access-control-allow-methods'], 'GET, HEAD, OPTIONS');
  assert.equal(response.headers['access-control-allow-headers'], '*');
  assert.equal(response.body, undefined);
});
