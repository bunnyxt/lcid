const { randomUUID } = require('node:crypto');
const { waitUntil } = require('@vercel/functions');

const POSTHOG_CAPTURE_URL = 'https://us.i.posthog.com/i/v0/e/';

function recordRedirectAttempt(request, problemId, targetSite, statusCode) {
  const token = process.env.POSTHOG_PROJECT_TOKEN;
  if (!token || process.env.VERCEL_ENV !== 'production' || !['GET', 'HEAD'].includes(request.method)) {
    return;
  }

  try {
    const event = {
      api_key: token,
      event: 'redirect_attempt',
      distinct_id: randomUUID(),
      timestamp: new Date().toISOString(),
      properties: {
        problem_id: problemId,
        target_site: targetSite,
        status_code: statusCode,
        success: statusCode === 302,
        $process_person_profile: false,
        $geoip_disable: true,
      },
    };

    const delivery = fetch(POSTHOG_CAPTURE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(3000),
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result.quota_limited?.length) {
        throw new Error('quota exceeded');
      }
    }).catch((error) => {
      console.error('Failed to record redirect attempt:', error);
    });

    waitUntil(delivery);
  } catch (error) {
    console.error('Failed to schedule redirect analytics:', error);
  }
}

module.exports = { recordRedirectAttempt };
