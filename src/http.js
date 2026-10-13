// Shared request guards for the Worker and optional Node SQLite adapter.
export const HTTP_LIMITS = Object.freeze({ bodyBytes: 16384, perMinute: 240, perSession: 2000, sessionMs: 86400000 });
export const SECURITY_HEADERS = Object.freeze({
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
});
export function json(value, status = 200, extra = {}) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS, ...extra } }); }
export function guardOrigin(request) {
  const origin = new URL(request.url).origin, incoming = request.headers.get('Origin');
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site' || (incoming && incoming !== origin) || (request.method === 'POST' && incoming !== origin)) return json({ ok: false, code: 'ORIGIN_REJECTED', message: 'Open this independent demo on its own origin before changing state.' }, 403);
  return null;
}
export function cookieId(request) { const match = request.headers.get('Cookie')?.match(/(?:^|;\s*)pbp_session=([a-f0-9-]{36})(?:;|$)/); return match?.[1] ?? null; }
export async function readAction(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') ?? '')) return { error: json({ ok: false, code: 'CONTENT_TYPE', message: 'Actions require JSON, not uploads.' }, 415) };
  const declared = request.headers.get('Content-Length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > HTTP_LIMITS.bodyBytes)) return { error: json({ ok: false, code: 'BODY_LIMIT', message: 'Synthetic requests are limited to 16 KB.' }, 413) };
  const reader = request.body?.getReader();
  if (!reader) return { error: json({ ok: false, code: 'INVALID_JSON', message: 'A JSON action is required.' }, 400) };
  let size = 0, chunks = [];
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > HTTP_LIMITS.bodyBytes) { await reader.cancel(); return { error: json({ ok: false, code: 'BODY_LIMIT', message: 'Synthetic requests are limited to 16 KB.' }, 413) }; } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
    const action = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    return { action };
  } catch { return { error: json({ ok: false, code: 'INVALID_JSON', message: 'Malformed JSON was rejected without changing booking state.' }, 400) }; }
}
export function chargeRequest(security, token, needsToken = true, now = Date.now()) {
  if (now - security.bornAt >= HTTP_LIMITS.sessionMs) return { error: { ok: false, code: 'SESSION_EXPIRED', message: 'This synthetic session expired after 24 hours. Open a new demo session.' }, status: 401 };
  if (needsToken && token !== security.token) return { error: { ok: false, code: 'TOKEN_REJECTED', message: 'The session token does not match this visitor.' }, status: 403 };
  if (now - security.windowStart >= 60000) { security.windowStart = now; security.windowCount = 0; }
  if (security.windowCount >= HTTP_LIMITS.perMinute || security.requestCount >= HTTP_LIMITS.perSession) return { error: { ok: false, code: 'REQUEST_LIMIT', message: 'This bounded synthetic session reached its request limit.' }, status: 429 };
  security.windowCount++; security.requestCount++; return { security };
}
export function createSecurity() { const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return { token: [...bytes].map(b => b.toString(16).padStart(2, '0')).join(''), bornAt: Date.now(), windowStart: Date.now(), windowCount: 0, requestCount: 0 }; }
export function cookieHeader(id, url) { return `pbp_session=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${new URL(url).protocol === 'https:' ? '; Secure' : ''}`; }
