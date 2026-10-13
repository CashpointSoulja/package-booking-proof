import { DurableObject } from 'cloudflare:workers';
import { createState, dispatch, publicState } from './domain.js';
import { runEvaluation } from './eval.js';
import { json, guardOrigin, cookieId, readAction, chargeRequest, createSecurity, cookieHeader, SECURITY_HEADERS } from './http.js';

// Each visitor owns an independent synthetic venue; competitors within it share capacity.
export class BookingSession extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS session (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL, security TEXT NOT NULL)');
  }
  async fetch(request) {
    const url = new URL(request.url), action = url.pathname === '/api/action' ? await readAction(request) : null;
    const parseError = action?.error ? { body: await action.error.json(), status: action.error.status } : null;
    const value = this.ctx.storage.transactionSync(() => {
      let row = this.ctx.storage.sql.exec('SELECT data, security FROM session WHERE id = 1').toArray()[0];
      if (url.pathname === '/internal/bootstrap') {
        if (!row) {
          const state = createState(), security = createSecurity();
          this.ctx.storage.sql.exec('INSERT INTO session(id,data,security) VALUES(1,?,?)', JSON.stringify(state), JSON.stringify(security));
          row = { data: JSON.stringify(state), security: JSON.stringify(security) };
        }
        return { body: { ok: true, token: JSON.parse(row.security).token, state: JSON.parse(row.data), runtime: 'Cloudflare Worker · SQLite Durable Object' } };
      }
      if (!row) return { body: { ok: false, code: 'SESSION_EXPIRED', message: 'This visitor has no persisted session.' }, status: 401 };
      const security = JSON.parse(row.security), charged = chargeRequest(security, request.headers.get('X-Session-Token'), url.pathname !== '/api/session');
      if (charged.error) return { body: charged.error, status: charged.status };
      let state = JSON.parse(row.data), body;
      if (parseError) {
        this.ctx.storage.sql.exec('UPDATE session SET security=? WHERE id=1', JSON.stringify(security));
        return parseError;
      }
      if (url.pathname === '/api/session') body = { ok: true, token: security.token, state: publicState(state), runtime: 'Cloudflare Worker · SQLite Durable Object' };
      else if (url.pathname === '/api/eval') body = { ok: true, evaluation: runEvaluation({ injectBrokenRule: url.searchParams.get('broken') === '1' }), runtime: 'Shared booking domain · deterministic synthetic fixtures' };
      else {
        const transition = dispatch(state, url.pathname === '/api/action' ? action.action : { type: 'state' });
        state = transition.state; body = { ...transition.result, state: publicState(state), runtime: 'Cloudflare Worker · SQLite Durable Object' };
      }
      this.ctx.storage.sql.exec('UPDATE session SET data=?, security=? WHERE id=1', JSON.stringify(state), JSON.stringify(security));
      return { body, status: body.ok ? 200 : body.code === 'UNKNOWN_ACTION' || body.code === 'INVALID_ACTION' || body.code === 'UNEXPECTED_FIELD' ? 400 : 409 };
    });
    return json(value.body, value.status ?? 200);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      const response = await env.ASSETS.fetch(request), headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
      return new Response(response.body, { status: response.status, headers });
    }
    const rejected = guardOrigin(request); if (rejected) return rejected;
    if (!['/api/session', '/api/state', '/api/action', '/api/eval'].includes(url.pathname)) return json({ ok: false, code: 'NOT_FOUND', message: 'No synthetic endpoint exists here.' }, 404);
    if (request.method !== (url.pathname === '/api/action' ? 'POST' : 'GET')) return json({ ok: false, code: 'METHOD_REJECTED', message: 'This endpoint does not support that method.' }, 405);
    let id = cookieId(request);
    if (url.pathname === '/api/session') {
      if (id) {
        const existing = await env.BOOKING_SESSIONS.get(env.BOOKING_SESSIONS.idFromName(id)).fetch(request);
        if (existing.status !== 401) return existing;
      }
      // New-session creation has no global/IP budget: explicit deployment blocker, documented.
      id = crypto.randomUUID(); const stub = env.BOOKING_SESSIONS.get(env.BOOKING_SESSIONS.idFromName(id));
      const boot = new URL(request.url); boot.pathname = '/internal/bootstrap';
      const response = await stub.fetch(new Request(boot, { method: 'GET' })), headers = new Headers(response.headers);
      headers.set('Set-Cookie', cookieHeader(id, request.url));
      return new Response(response.body, { status: response.status, headers });
    }
    if (!id) return json({ ok: false, code: 'SESSION_REQUIRED', message: 'Start a visitor-isolated synthetic session first.' }, 401);
    return env.BOOKING_SESSIONS.get(env.BOOKING_SESSIONS.idFromName(id)).fetch(request);
  }
};
