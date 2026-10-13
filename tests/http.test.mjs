import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
rmSync('work/test-results/security.json', { force: true });
const { HTTP_LIMITS, chargeRequest } = await import('../src/http.js');
const { createChecks } = await import('./assertions.mjs');

const checks = createChecks();
const start = 1000000;
const security = { token: 'synthetic-test-token', bornAt: start, windowStart: start, windowCount: 0, requestCount: 0 };
for (let i = 0; i < HTTP_LIMITS.perSession; i++) {
  const now = start + Math.floor(i / 100) * 60000;
  const charged = chargeRequest(security, 'synthetic-test-token', true, now);
  if (charged.error) throw new Error(`Quota rejected allowed request ${i}: ${charged.error.code}`);
}
checks.equal('Security admits exactly the bounded lifetime request budget', security.requestCount, HTTP_LIMITS.perSession);
checks.equal('New minute cannot bypass the lifetime request budget', chargeRequest(security, 'synthetic-test-token', true, start + 21 * 60000).status, 429);
const expired = { token: 'synthetic-test-token', bornAt: start, windowStart: start, windowCount: 0, requestCount: 0 };
checks.equal('Fixed security clock expires a session at exactly 24 hours', chargeRequest(expired, 'synthetic-test-token', true, start + HTTP_LIMITS.sessionMs).status, 401);
checks.equal('Expired session does not consume another request', expired.requestCount, 0);
const fresh = { token: 'synthetic-test-token', bornAt: start, windowStart: start, windowCount: 0, requestCount: 0 };
checks.equal('Wrong visitor token is rejected before charging the quota', chargeRequest(fresh, 'wrong-token', true, start).status, 403);
checks.equal('Wrong token cannot consume another visitors request allowance', fresh.requestCount, 0);
mkdirSync('work/test-results', { recursive: true });
writeFileSync('work/test-results/security.json', JSON.stringify({ runtime: 'Shared HTTP guard module with explicit deterministic clock', assertions: checks.results }, null, 2));
