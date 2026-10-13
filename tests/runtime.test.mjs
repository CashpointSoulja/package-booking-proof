import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
rmSync('work/test-results/runtime.json', { force: true });
const { Miniflare, convertV4MiniflareOptions } = await import('miniflare');
const { createChecks } = await import('./assertions.mjs');
const { HTTP_LIMITS } = await import('../src/http.js');

const checks = createChecks();
const persistence = mkdtempSync(join(tmpdir(), 'package-booking-do-tests-'));
const options = convertV4MiniflareOptions({
  name: 'package-booking-proof',
  modules: ['worker.js', 'domain.js', 'eval.js', 'http.js'].map(name => ({ type: 'ESModule', path: resolve('src', name) })),
  modulesRoot: resolve('src'),
  compatibilityDate: '2026-10-13',
  durableObjects: { BOOKING_SESSIONS: { className: 'BookingSession', useSQLite: true } },
  resourcePersistencePath: persistence,
  assets: { directory: resolve('public'), binding: 'ASSETS', run_worker_first: true, routerConfig: { has_user_worker: true } },
  telemetry: { enabled: false },
  port: 0,
  host: '127.0.0.1'
});
let mf;
let origin;
async function start() {
  mf = new Miniflare(options);
  origin = (await mf.ready).origin;
}
async function request(path, visitor = null, extra = {}) {
  // Early Origin/body-limit rejection may close an unread-body keep-alive socket.
  // Each HTTP request gets an explicitly closing connection; never retry mutations.
  const headers = { Connection: 'close', ...(visitor ? { Cookie: visitor.cookie, 'X-Session-Token': visitor.token } : {}), ...extra.headers };
  const response = await fetch(`${origin}${path}`, { ...extra, headers });
  const body = await response.json();
  return { status: response.status, body, response };
}
async function session(existing = null) {
  const r = await request('/api/session', existing);
  checks.equal('Visitor session bootstrap succeeds', r.status, 200);
  return { cookie: r.response.headers.get('Set-Cookie')?.split(';')[0] ?? existing.cookie, token: r.body.token, state: r.body.state, cookieFlags: r.response.headers.get('Set-Cookie') ?? existing?.cookieFlags };
}
async function action(visitor, value, extra = {}) {
  return request('/api/action', visitor, { method: 'POST', body: JSON.stringify(value), ...extra,
    headers: { Origin: origin, 'Content-Type': 'application/json', ...extra.headers } });
}
async function quotes(visitor) { return (await action(visitor, { type: 'availability' })).body.quotes; }
async function state(visitor) { return (await request('/api/state', visitor)).body.state; }
try {
  await start();
  const initialPage = await fetch(origin, { headers: { Connection: 'close' } });
  checks.equal('Actual Worker serves its asset root over HTTP', initialPage.status, 200);
  checks.equal('Worker serves a restrictive CSP', initialPage.headers.get('Content-Security-Policy')?.includes("frame-ancestors 'none'"), true);
  await initialPage.text();
  const a = await session();
  checks.truth('Session cookie is HttpOnly and SameSite Strict', a.cookieFlags.includes('HttpOnly') && a.cookieFlags.includes('SameSite=Strict'));
  const q = (await quotes(a)).find(q => q.optionId === 'standard');
  const attempts = await Promise.all([
    action(a, { type: 'reserve', quoteId: q.id, idempotencyKey: 'concurrent-1' }),
    action(a, { type: 'reserve', quoteId: q.id, idempotencyKey: 'concurrent-2' })
  ]);
  checks.equal('Concurrent HTTP attempts have one winner and one conflict', attempts.map(r => r.status).sort(), [200, 409]);
  const winner = attempts.find(r => r.status === 200);
  const key = winner.body.receipt.key;
  const bookingId = winner.body.booking.id;
  let latest = await state(a);
  checks.equal('SQLite transaction commits exactly one package booking', latest.bookings.length, 1);
  checks.equal('Winning package owns practitioner, room and area together', latest.bookings[0].parts.flatMap(p => p.claims).length, 3);
  checks.equal('Every claimed resource remains within authoritative capacity', latest.catalog.resources.every(resource => {
    const quantity = latest.bookings.filter(b => ['held', 'submitted', 'settled', 'fulfilled'].includes(b.status)).flatMap(b => b.parts.flatMap(p => p.claims)).filter(c => c.key === resource.key).reduce((sum, c) => sum + c.quantity, 0);
    return quantity <= resource.capacity;
  }), true);
  const recovered = await action(a, { type: 'receipt', idempotencyKey: key });
  checks.equal('Unknown-response lookup recovers winning HTTP booking', recovered.body.receipt.bookingId, bookingId);
  const replay = await action(a, { type: 'reserve', quoteId: q.id, idempotencyKey: key });
  checks.equal('HTTP idempotent retry recovers the same booking', replay.body.booking.id, bookingId);
  checks.equal('HTTP duplicate reserve preserves one booking', replay.body.state.bookings.length, 1);
  const reload = await session(a);
  checks.equal('Reload retains the visitor token', reload.token === a.token, true);
  checks.equal('Reload retains the authoritative held booking', reload.state.bookings[0].id, bookingId);
  const b = await session();
  checks.equal('Another visitor begins with separate inventory state', b.state.bookings.length, 0);
  checks.equal('Another visitor has a distinct session token', b.token === a.token, false);
  checks.equal('A token cannot authenticate another visitor cookie', (await request('/api/state', { cookie: b.cookie, token: a.token })).status, 403);
  checks.equal('An endpoint without a visitor session is rejected', (await request('/api/state')).status, 401);
  checks.equal('An invalid token is rejected', (await request('/api/state', { cookie: a.cookie, token: 'bad-token' })).status, 403);
  checks.equal('Hostile Origin cannot mutate booking state', (await action(a, { type: 'release', bookingId }, { headers: { Origin: 'https://hostile.example' } })).status, 403);
  checks.equal('Missing POST Origin cannot mutate booking state', (await action(a, { type: 'release', bookingId }, { headers: { Origin: '' } })).status, 403);
  checks.equal('Cross-site fetch metadata is rejected', (await request('/api/state', a, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  checks.equal('Wrong content type is rejected', (await action(a, { type: 'release', bookingId }, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  checks.equal('JSON null is an invalid action rather than a state read', (await action(a, null)).status, 400);
  checks.equal('Malformed JSON cannot enter domain state', (await request('/api/action', a, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{broken' })).status, 400);
  checks.equal('Oversized declared body is rejected', (await request('/api/action', a, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: 'x'.repeat(HTTP_LIMITS.bodyBytes + 1) })).status, 413);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(HTTP_LIMITS.bodyBytes + 1))); controller.close(); } });
  checks.equal('Oversized chunked body is rejected without a declared length', (await request('/api/action', a, { method: 'POST', duplex: 'half', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: stream })).status, 413);
  checks.equal('Unknown action type is rejected at the real Worker', (await action(a, { type: 'arbitrary-vendor-action' })).status, 400);
  checks.equal('Client cannot supply an authoritative price override', (await action(a, { type: 'release', bookingId, totalMinor: 1 })).status, 400);
  checks.equal('Client cannot inject the test-only expiry option', (await action(a, { type: 'advance', seconds: 121, skipExpiry: true })).status, 400);
  checks.equal('Rejected hostile requests retain the held booking', (await state(a)).bookings[0].status, 'held');
  const stale = (await quotes(b)).find(q => q.optionId === 'standard');
  await action(b, { type: 'price-change', optionId: 'standard', deltaMinor: 500 });
  checks.equal('HTTP stale quote rejects changed authoritative price', (await action(b, { type: 'reserve', quoteId: stale.id, idempotencyKey: 'stale-http' })).status, 409);
  checks.equal('HTTP stale quote creates no booking', (await state(b)).bookings.length, 0);
  const beforeImport = JSON.stringify((await state(b)).catalog);
  const validRow = { synthetic: true, site: 'site-a', offeringType: 'room', id: 'synthetic-room-03', capacity: 1, currency: 'GBP' };
  checks.equal('HTTP mixed valid/invalid import rejects atomically', (await action(b, { type: 'import-preview', rows: [validRow, { ...validRow, id: 'synthetic-room-04', capacity: -1 }] })).status, 409);
  checks.equal('HTTP malformed import changes no catalog rows', JSON.stringify((await state(b)).catalog) === beforeImport, true);
  checks.equal('HTTP personal field import is rejected', (await action(b, { type: 'import-preview', rows: [{ ...validRow, name: 'PERSONAL_UPLOAD_FORBIDDEN' }] })).status, 409);
  const preview = await action(b, { type: 'import-preview', rows: [validRow] });
  checks.equal('HTTP preview leaves inventory unchanged until commit', JSON.stringify(preview.body.state.catalog) === beforeImport, true);
  checks.equal('HTTP explicit synthetic commit succeeds', (await action(b, { type: 'import-commit', previewId: preview.body.previewId })).status, 200);
  checks.equal('HTTP synthetic commit appends exactly one resource', (await state(b)).catalog.resources.length, 4);
  await action(a, { type: 'advance', seconds: 121 });
  checks.equal('HTTP fixed simulation advance expires the hold', (await state(a)).bookings[0].status, 'expired');
  const fresh = (await quotes(a)).find(q => q.optionId === 'standard');
  const replacement = await action(a, { type: 'reserve', quoteId: fresh.id, idempotencyKey: 'post-expiry' });
  checks.equal('HTTP expired inventory becomes available again', replacement.status, 200);
  const replacementId = replacement.body.booking.id;
  await action(a, { type: 'edit', bookingId: replacementId, guestId: 'synthetic-guest-01', consent: true, preferenceId: 'quiet' });
  await action(a, { type: 'validate', bookingId: replacementId });
  await action(a, { type: 'submit', bookingId: replacementId, idempotencyKey: 'http-submit' });
  checks.equal('HTTP submitted order cannot fulfill before settlement', (await action(a, { type: 'fulfill', bookingId: replacementId })).status, 409);
  await action(a, { type: 'settle', bookingId: replacementId, eventId: 'http-settled', sequence: 2, status: 'settled' });
  await action(a, { type: 'settle', bookingId: replacementId, eventId: 'http-settled', sequence: 2, status: 'settled' });
  await action(a, { type: 'settle', bookingId: replacementId, eventId: 'http-late-failed', sequence: 1, status: 'failed' });
  checks.equal('HTTP duplicate/out-of-order settlement preserves settled state', (await state(a)).bookings.find(x => x.id === replacementId).status, 'settled');
  checks.equal('Worker executes all shared domain scenarios', (await request('/api/eval', a)).body.evaluation.failed, 0);
  checks.truth('Worker broken-rule injection turns shared evidence red', (await request('/api/eval?broken=1', a)).body.evaluation.failed > 0);

  const quota = await session();
  const quotaRequests = await Promise.all(Array.from({ length: HTTP_LIMITS.perMinute - 1 }, () => request('/api/state', quota)));
  checks.equal('Allowed requests fit the per-minute quota', quotaRequests.every(r => r.status === 200), true);
  checks.equal('Reset succeeds at the final request in the quota', (await action(quota, { type: 'reset' })).status, 200);
  checks.equal('Reset cannot erase the request quota', (await request('/api/state', quota)).status, 429);
  const safeNew = await session();
  checks.equal('One visitor hitting the request cap does not throttle another', (await request('/api/state', safeNew)).status, 200);

  const persistentSnapshot = await state(a);
  await mf.dispose(); mf = null;
  await start();
  const afterRestart = await session(a);
  checks.equal('Actual workerd restart restores the visitor token from SQLite', afterRestart.token === a.token, true);
  checks.equal('Actual workerd restart restores booking and settlement ledger', JSON.stringify(afterRestart.state.bookings) === JSON.stringify(persistentSnapshot.bookings), true);
  checks.equal('Actual workerd restart restores import catalog independently', (await state(b)).catalog.resources.length, 4);
  checks.equal('Actual workerd restart preserves per-visitor request limits', (await request('/api/state', quota)).status, 429);
  checks.equal('Receipt recovery still succeeds after runtime restart', (await action(a, { type: 'receipt', idempotencyKey: 'http-submit' })).body.receipt.bookingId, replacementId);

  mkdirSync('work/test-results', { recursive: true });
  writeFileSync('work/test-results/runtime.json', JSON.stringify({
    runtime: 'Actual Cloudflare workerd via Miniflare 5.20261006.1-alpha · Worker HTTP · SQLite Durable Object',
    assertions: checks.results,
    persistence: 'Disposed workerd and recreated Miniflare with the same on-disk resource persistence root',
    transport: 'Actual loopback HTTP requests with Connection: close, response bodies consumed, no automatic retries',
    liveDeployment: false
  }, null, 2));
  console.log(`Runtime evidence: ${checks.results.length} HTTP/persistence assertions passed.`);
} finally {
  if (mf) await mf.dispose();
  rmSync(persistence, { recursive: true, force: true });
}
