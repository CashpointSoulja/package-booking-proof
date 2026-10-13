// Independent synthetic booking rules. No vendor API or payment integration.
export const LIMITS = Object.freeze({ audit: 80, quotes: 24, bookings: 24, receipts: 48, events: 64, outbox: 12, resources: 36, importRows: 12, stateBytes: 131072, holdSeconds: 120, quoteSeconds: 60 });
export const FIXED_CLOCK = Date.parse('2026-10-13T09:00:00Z');
const clone = value => structuredClone(value);
const active = b => ['held', 'submitted', 'settled', 'fulfilled'].includes(b.status);
const overlap = (a, b) => a.start < b.end && b.start < a.end;
const err = (code, message) => { const e = new Error(message); e.code = code; throw e; };
const requireRule = (condition, code, message) => { if (!condition) err(code, message); };
const isInt = n => Number.isSafeInteger(n);
const identifier = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
export function resourceKey(site, type, id) {
  if (![site, type, id].every(identifier)) throw new Error('Resource identifiers must be bounded safe identifiers.');
  return `${site}|${type}|${id}`;
}
export function minorUnits(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(value)) throw new Error('Use a nonnegative decimal with at most two fractional digits.');
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function createState() {
  const resources = [['practitioner', '1', 'Synthetic practitioner 01', 1], ['room', '1', 'Synthetic room 01', 1], ['area_booking', '1', 'Synthetic shared area 01', 1]].map(([offeringType, id, name, capacity]) => ({ key: resourceKey('site-a', offeringType, id), site: 'site-a', offeringType, id, name, capacity, currency: 'GBP' }));
  const part = (name, start, end, priceMinor, types) => ({ name, start: Date.parse(`2026-10-13T${start}:00Z`), end: Date.parse(`2026-10-13T${end}:00Z`), priceMinor, currency: 'GBP', claims: types.map(t => ({ key: resourceKey('site-a', t, '1'), start: Date.parse(`2026-10-13T${start}:00Z`), end: Date.parse(`2026-10-13T${end}:00Z`), quantity: 1 })) });
  return { version: 1, synthetic: true, clock: FIXED_CLOCK, revision: 1, priceRevision: 1, counter: 0, activeBookingId: null, catalog: { resources, options: [
    { id: 'standard', site: 'site-a', offeringType: 'package', name: 'Restore & unwind', currency: 'GBP', totalMinor: 11000, parts: [part('Restorative treatment · practitioner + room', '14:00', '15:00', 8500, ['practitioner', 'room']), part('Shared-area session', '15:15', '16:00', 2500, ['area_booking'])] },
    { id: 'alternative', site: 'site-a', offeringType: 'package', name: 'Restore & unwind · later', currency: 'GBP', totalMinor: 12000, parts: [part('Restorative treatment · practitioner + room', '16:00', '17:00', 9500, ['practitioner', 'room']), part('Shared-area session', '17:15', '18:00', 2500, ['area_booking'])] }
  ] }, quotes: [], bookings: [], receipts: [], events: [], outbox: [], audit: [], importPreview: null };
}
const nextId = (s, prefix) => `${prefix}-${++s.counter}`;
const audit = (s, type, code, bookingId = null) => { s.audit.push({ id: nextId(s, 'audit'), at: s.clock, type, code, bookingId, synthetic: true }); s.audit = s.audit.slice(-LIMITS.audit); };
const exception = reason => ({ reason, owner: 'Demo operations lead', nextStep: 'Review the synthetic payment exception, then safely void and offer a fresh package.' });
function expire(s) {
  for (const b of s.bookings) {
    if (['held', 'submitted'].includes(b.status) && b.expiresAt <= s.clock) {
      b.status = b.status === 'held' ? 'expired' : 'exception'; b.validation = null; b.revision++; s.revision++;
      if (b.status === 'exception') b.exception = exception('Settlement deadline expired; synthetic resources released.');
      audit(s, 'expiry', b.status.toUpperCase(), b.id);
    }
  }
  s.quotes = s.quotes.filter(q => q.expiresAt > s.clock).slice(-LIMITS.quotes);
}
function checkOption(s, option, excludeId = null) {
  requireRule(option && option.site === 'site-a' && option.offeringType === 'package', 'INVALID_OFFERING', 'The package must belong to the synthetic site.');
  requireRule(option.parts.length === 2 && option.parts.every(p => p.currency === option.currency) && option.currency === 'GBP', 'MIXED_CURRENCY', 'Every component must use the same supported currency.');
  requireRule(option.parts.every(p => isInt(p.priceMinor) && p.priceMinor >= 0 && p.priceMinor <= 1000000) && isInt(option.totalMinor) && option.totalMinor >= 0 && option.totalMinor <= 1000000 && option.parts.reduce((n, p) => n + p.priceMinor, 0) === option.totalMinor, 'INVALID_PRICE', 'The authoritative integer component prices must match the package total.');
  requireRule(option.parts.every(p => isInt(p.start) && isInt(p.end) && p.start < p.end && p.start > s.clock && p.claims.every(c => c.start === p.start && c.end === p.end)), 'INVALID_SLOT', 'Each component claim must match its displayed interval exactly.');
  const all = option.parts.flatMap(p => p.claims);
  requireRule(all.length === 3 && option.parts[0].claims.length === 2 && option.parts[1].claims.length === 1, 'INVALID_COMPONENTS', 'A package needs practitioner, room, and shared-area claims.');
  requireRule(option.parts[0].end <= option.parts[1].start, 'PACKAGE_OVERLAP', 'Package parts must run in sequence.');
  for (let i = 0; i < all.length; i++) {
    const claim = all[i], resource = s.catalog.resources.find(r => r.key === claim.key);
    requireRule(resource && resource.key === resourceKey(resource.site, resource.offeringType, resource.id) && resource.site === option.site, 'CROSS_SITE', 'A resource cannot be borrowed across sites or offering types.');
    requireRule(resource.currency === option.currency && isInt(resource.capacity) && resource.capacity >= 0 && resource.capacity <= 12, 'INVALID_CAPACITY', 'Capacity must be a nonnegative bounded integer in the package currency.');
    requireRule(isInt(claim.start) && isInt(claim.end) && claim.start < claim.end && claim.start > s.clock && isInt(claim.quantity) && claim.quantity > 0, 'INVALID_SLOT', 'Resource intervals and quantities must be valid and in the future.');
    const matching = s.bookings.filter(b => b.id !== excludeId && active(b)).flatMap(b => b.parts.flatMap(p => p.claims)).filter(c => c.key === claim.key && overlap(c, claim));
    // Conservative across the complete requested interval: never oversell overlapping claims.
    const used = matching.reduce((n, c) => n + c.quantity, 0) + all.slice(0, i).filter(c => c.key === claim.key && overlap(c, claim)).reduce((n, c) => n + c.quantity, 0);
    requireRule(used + claim.quantity <= resource.capacity, 'CAPACITY_CONFLICT', 'A package component was just taken. Refresh availability and choose explicitly.');
  }
  requireRule(s.catalog.resources.find(r => r.key === all[0].key)?.offeringType === 'practitioner' && s.catalog.resources.find(r => r.key === all[1].key)?.offeringType === 'room' && s.catalog.resources.find(r => r.key === all[2].key)?.offeringType === 'area_booking', 'INVALID_COMPONENTS', 'Component resource types must match the package.');
}
function quote(s, option) {
  let available = true, reason = null;
  try { checkOption(s, option); } catch (e) { available = false; reason = e.message; }
  const q = { id: nextId(s, 'quote'), optionId: option.id, site: option.site, revision: s.revision, priceRevision: s.priceRevision, quotedAt: s.clock, expiresAt: s.clock + LIMITS.quoteSeconds * 1000, name: option.name, currency: option.currency, totalMinor: option.totalMinor, parts: clone(option.parts), available, reason };
  s.quotes.push(q); s.quotes = s.quotes.slice(-LIMITS.quotes); return q;
}
function booking(s, id) { const b = s.bookings.find(x => x.id === id); requireRule(b, 'BOOKING_NOT_FOUND', 'No booking with this identifier exists in your synthetic session.'); return b; }
function held(s, id) { const b = booking(s, id); requireRule(b.status === 'held', 'HOLD_NOT_ACTIVE', 'This hold is no longer active. Get fresh availability.'); return b; }
function fingerprint(a) { return JSON.stringify(Object.fromEntries(Object.entries(a).sort(([a], [b]) => a.localeCompare(b)))); }
function previous(s, a) {
  requireRule(identifier(a.idempotencyKey), 'INVALID_KEY', 'Use a bounded idempotency key for every reserve or submit.');
  const receipt = s.receipts.find(r => r.key === a.idempotencyKey);
  if (!receipt) { requireRule(s.receipts.length < LIMITS.receipts, 'RECEIPT_LIMIT', 'Receipt storage is full. Start a new synthetic session.'); return null; }
  requireRule(receipt.fingerprint === fingerprint(a), 'IDEMPOTENCY_CONFLICT', 'This idempotency key already identifies different evidence. Look up its receipt.');
  return { ok: true, code: 'REPLAYED', message: 'The original committed receipt was recovered.', receipt: clone(receipt), booking: clone(booking(s, receipt.bookingId)) };
}
function receipt(s, a, b) { const r = { id: nextId(s, 'receipt'), key: a.idempotencyKey, type: a.type, bookingId: b.id, orderId: b.orderId ?? null, at: s.clock, fingerprint: fingerprint(a), synthetic: true }; s.receipts.push(r); return r; }
function validate(s, b) {
  const option = s.catalog.options.find(o => o.id === b.optionId);
  checkOption(s, option, b.id);
  requireRule(b.priceRevision === s.priceRevision && b.totalMinor === option.totalMinor && JSON.stringify(b.parts) === JSON.stringify(option.parts), 'PRICE_CHANGED', 'Time or price evidence changed. Release the hold and choose the updated package explicitly.');
  requireRule(b.guestId === 'synthetic-guest-01' && b.consent === true, 'CONSENT_REQUIRED', 'Assign the predefined synthetic guest and confirm consent for this demo.');
}
function rowsForImport(s, rows) {
  requireRule(Array.isArray(rows) && rows.length > 0 && rows.length <= LIMITS.importRows, 'INVALID_IMPORT', 'Preview between 1 and 12 synthetic resource rows.');
  const keys = new Set();
  return rows.map(row => {
    const allowed = ['synthetic', 'site', 'offeringType', 'id', 'capacity', 'currency'];
    requireRule(row && Object.keys(row).length === allowed.length && Object.keys(row).every(k => allowed.includes(k)) && row.synthetic === true && row.site === 'site-a' && ['room', 'practitioner', 'area_booking'].includes(row.offeringType) && typeof row.id === 'string' && /^synthetic-[a-z0-9-]{1,32}$/.test(row.id) && isInt(row.capacity) && row.capacity >= 0 && row.capacity <= 12 && row.currency === 'GBP', 'INVALID_IMPORT', 'Only strict synthetic resources are accepted. Names, contact data, and personal uploads are rejected.');
    const key = resourceKey(row.site, row.offeringType, row.id);
    requireRule(!keys.has(key), 'INVALID_IMPORT', 'Duplicate resource rows are rejected atomically.'); keys.add(key);
    return { ...clone(row), key, name: `Synthetic ${row.offeringType} ${row.id}` };
  });
}
function act(s, a, options) {
  switch (a.type) {
    case 'state': return { message: 'Latest persisted synthetic state.' };
    case 'availability': return { quotes: s.catalog.options.map(o => quote(s, o)), message: 'These snapshots expire; no capacity is held yet.' };
    case 'reserve': {
      const replay = previous(s, a); if (replay) return replay;
      const q = s.quotes.find(q => q.id === a.quoteId);
      requireRule(q && q.expiresAt > s.clock, 'QUOTE_EXPIRED', 'This availability snapshot expired. Refresh before reserving.');
      requireRule(q.revision === s.revision && q.priceRevision === s.priceRevision, 'STALE_QUOTE', 'Availability or price changed. Refresh and choose explicitly.');
      const option = s.catalog.options.find(o => o.id === q.optionId); checkOption(s, option);
      requireRule(q.totalMinor === option.totalMinor && JSON.stringify(q.parts) === JSON.stringify(option.parts), 'STALE_QUOTE', 'The quote no longer matches authoritative time or price.');
      requireRule(s.bookings.length < LIMITS.bookings, 'BOOKING_LIMIT', 'This session reached its bounded booking limit. Start a new demo.');
      const b = { id: nextId(s, 'booking'), optionId: option.id, name: option.name, site: option.site, parts: clone(option.parts), totalMinor: option.totalMinor, currency: option.currency, priceRevision: s.priceRevision, revision: 1, status: 'held', createdAt: s.clock, expiresAt: s.clock + LIMITS.holdSeconds * 1000, guestId: null, consent: false, preferenceId: 'none', validation: null, exception: null, competitor: false, eventSequence: 0, orderId: null, paymentStatus: 'not-started' };
      s.bookings.push(b); s.activeBookingId = b.id; s.revision++;
      return { booking: b, receipt: receipt(s, a, b), message: 'Both package parts are held together for two simulated minutes.' };
    }
    case 'compete': {
      const oldActive = s.activeBookingId, q = quote(s, s.catalog.options[0]);
      const r = act(s, { type: 'reserve', quoteId: q.id, idempotencyKey: nextId(s, 'competitor-key') }, options);
      r.booking.competitor = true; s.activeBookingId = oldActive;
      return { booking: r.booking, message: 'A synthetic competing guest took the first package. Your old snapshot is stale.' };
    }
    case 'edit': {
      const b = held(s, a.bookingId);
      requireRule(a.guestId === 'synthetic-guest-01' && typeof a.consent === 'boolean' && ['quiet', 'none'].includes(a.preferenceId), 'SYNTHETIC_ONLY', 'Use only the predefined synthetic guest and preference; personal details are not accepted.');
      Object.assign(b, { guestId: a.guestId, consent: a.consent, preferenceId: a.preferenceId, validation: null }); b.revision++; s.revision++;
      return { booking: b, message: 'Guest selection saved. Every edit invalidates previous checkout validation.' };
    }
    case 'validate': {
      const b = held(s, a.bookingId); validate(s, b);
      b.validation = { bookingRevision: b.revision, stateRevision: s.revision, priceRevision: s.priceRevision, at: s.clock, expiresAt: b.expiresAt };
      return { booking: b, message: 'Latest availability, synthetic consent, time and authoritative price all pass.' };
    }
    case 'submit': {
      const replay = previous(s, a); if (replay) return replay;
      const b = held(s, a.bookingId); validate(s, b);
      requireRule(b.validation && b.validation.bookingRevision === b.revision && b.validation.stateRevision === s.revision && b.validation.priceRevision === s.priceRevision && b.validation.expiresAt > s.clock, 'VALIDATION_REQUIRED', 'Run validation again against the latest basket evidence before submitting.');
      b.status = 'submitted'; b.orderId = nextId(s, 'order'); b.paymentStatus = 'pending'; b.revision++; b.validation = null; s.revision++;
      return { booking: b, receipt: receipt(s, a, b), message: 'Synthetic order submitted. Payment has not settled; fulfillment is blocked.' };
    }
    case 'settle': {
      const b = booking(s, a.bookingId);
      requireRule(identifier(a.eventId) && isInt(a.sequence) && a.sequence > 0 && ['settled', 'failed'].includes(a.status), 'INVALID_EVENT', 'Settlement events need a bounded ID, positive sequence and synthetic outcome.');
      const known = s.events.find(e => e.id === a.eventId);
      if (known) { requireRule(known.fingerprint === fingerprint(a), 'EVENT_CONFLICT', 'This event ID already describes another settlement outcome.'); return { booking: b, code: 'EVENT_DUPLICATE', message: 'Duplicate settlement event suppressed.' }; }
      requireRule(s.events.length < LIMITS.events, 'EVENT_LIMIT', 'The bounded event ledger is full.');
      if (a.sequence <= b.eventSequence || ['settled', 'fulfilled', 'void', 'exception', 'expired', 'released'].includes(b.status)) { s.events.push({ id: a.eventId, bookingId: b.id, sequence: a.sequence, status: a.status, fingerprint: fingerprint(a), at: s.clock, disposition: 'ignored' }); return { booking: b, code: 'EVENT_IGNORED', message: 'Late or out-of-order settlement cannot regress a terminal state.' }; }
      requireRule(b.status === 'submitted', 'NOT_SUBMITTED', 'A hold cannot settle before submission.');
      s.events.push({ id: a.eventId, bookingId: b.id, sequence: a.sequence, status: a.status, fingerprint: fingerprint(a), at: s.clock });
      b.eventSequence = a.sequence; b.paymentStatus = a.status; b.status = a.status === 'settled' ? 'settled' : 'exception'; b.revision++; s.revision++;
      if (a.status === 'failed') b.exception = exception('Simulated settlement failed; all package resources released.');
      return { booking: b, message: a.status === 'settled' ? 'Simulated funds settled. Fulfillment may now be marked.' : 'Simulated funds failed. Demo operations lead owns the exception and recovery.' };
    }
    case 'fulfill': {
      const b = booking(s, a.bookingId);
      if (b.status === 'fulfilled') return { booking: b, code: 'REPLAYED', message: 'Fulfillment was already recorded once.' };
      requireRule(b.status === 'settled', 'NOT_SETTLED', 'Fulfillment requires a settled synthetic payment, not a submitted order.');
      b.status = 'fulfilled'; b.revision++; s.revision++; return { booking: b, message: 'Synthetic fulfillment recorded after settlement.' };
    }
    case 'release': case 'void': {
      const b = booking(s, a.bookingId), target = a.type === 'release' ? 'released' : 'void';
      if (b.status === target) return { booking: b, code: 'REPLAYED', message: 'Capacity was already released.' };
      requireRule(a.type === 'release' ? b.status === 'held' : ['held', 'submitted', 'exception', 'expired', 'released'].includes(b.status), 'UNSAFE_VOID', 'Settled or fulfilled orders require a real refund policy outside this concept.');
      b.status = target; if (target === 'void') b.paymentStatus = 'void'; b.validation = null; b.revision++; s.revision++; return { booking: b, message: 'The complete synthetic package was safely released. No fulfillment occurred.' };
    }
    case 'receipt': {
      requireRule(identifier(a.idempotencyKey), 'INVALID_KEY', 'Provide the original bounded reserve or submit key.');
      const r = s.receipts.find(r => r.key === a.idempotencyKey); requireRule(r, 'RECEIPT_UNKNOWN', 'No committed receipt exists for this key. The result remains unknown; refresh state before retrying.');
      return { receipt: r, booking: booking(s, r.bookingId), message: 'Recovered the authoritative committed result without another booking.' };
    }
    case 'advance': {
      requireRule(isInt(a.seconds) && a.seconds > 0 && a.seconds <= 3600 && s.clock + a.seconds * 1000 <= FIXED_CLOCK + 86400000, 'INVALID_CLOCK', 'Advance 1–3600 seconds within the fixed demo day.');
      s.clock += a.seconds * 1000; if (!options.skipExpiry) expire(s); return { message: `Simulation clock advanced ${a.seconds} seconds; expired capacity was released.` };
    }
    case 'price-change': {
      const o = s.catalog.options.find(o => o.id === a.optionId);
      requireRule(o && isInt(a.deltaMinor) && Math.abs(a.deltaMinor) <= 100000 && o.parts[0].priceMinor + a.deltaMinor >= 0 && o.totalMinor + a.deltaMinor >= 0 && o.totalMinor + a.deltaMinor <= 1000000, 'INVALID_PRICE', 'Price changes must preserve bounded nonnegative integer minor units.');
      o.parts[0].priceMinor += a.deltaMinor; o.totalMinor += a.deltaMinor; s.priceRevision++; s.revision++;
      return { option: o, message: 'Synthetic authoritative price changed. Old quotes and validations cannot silently use it.' };
    }
    case 'outbox': {
      const b = booking(s, a.bookingId); requireRule(['submitted', 'settled', 'fulfilled', 'exception'].includes(b.status), 'HANDOFF_NOT_READY', 'Only submitted outcomes or owned exceptions can enter the synthetic outbox.');
      const key = `${b.id}:${b.exception ? 'exception' : 'submitted'}`, old = s.outbox.find(o => o.key === key);
      if (old) return { outbox: old, code: 'OUTBOX_DUPLICATE', message: 'Repeat delivery suppressed. No message was sent.' };
      requireRule(s.outbox.length < LIMITS.outbox && s.outbox.filter(o => s.clock - o.at < 60000).length < 3, 'OUTBOX_RATE_LIMIT', 'Synthetic handoffs are capped at three per simulated minute and twelve per session.');
      const item = { id: nextId(s, 'outbox'), key, bookingId: b.id, at: s.clock, synthetic: true, status: 'simulated-delivery', owner: 'Demo operations lead', nextStep: b.exception?.nextStep ?? 'Review this submitted synthetic order; wait for settlement before fulfillment.', destination: 'Demo inbox only — no email, SMS or webhook' };
      s.outbox.push(item); return { outbox: item, message: 'Synthetic handoff recorded for Demo operations lead. Nothing was sent externally.' };
    }
    case 'import-preview': {
      const rows = rowsForImport(s, a.rows), merged = new Map(s.catalog.resources.map(r => [r.key, r])); for (const r of rows) merged.set(r.key, r);
      requireRule(merged.size <= LIMITS.resources, 'IMPORT_LIMIT', 'The synthetic resource catalog is bounded at 36 rows.');
      const preview = { id: nextId(s, 'preview'), revision: s.revision, rows, at: s.clock, expiresAt: s.clock + 60000, synthetic: true };
      s.importPreview = preview; return { preview, previewId: preview.id, message: 'Strict synthetic preview is ready. Catalog changes only on explicit atomic commit.' };
    }
    case 'import-commit': {
      const p = s.importPreview; requireRule(p && p.id === a.previewId && p.expiresAt > s.clock && p.revision === s.revision, 'STALE_IMPORT', 'Import preview is missing, expired or stale. Preview again.');
      rowsForImport(s, p.rows.map(({ synthetic, site, offeringType, id, capacity, currency }) => ({ synthetic, site, offeringType, id, capacity, currency })));
      const resources = new Map(s.catalog.resources.map(r => [r.key, r])); for (const r of p.rows) resources.set(r.key, clone(r));
      s.catalog.resources = [...resources.values()]; s.importPreview = null; s.revision++; return { imported: p.rows.length, message: 'All synthetic resource rows committed together.' };
    }
    case 'reset': return { reset: true, message: 'The synthetic scenario was reset. Session security and request limits remain.' };
    default: err('UNKNOWN_ACTION', 'Unknown synthetic action.');
  }
}
const actionFields = { state: [], availability: [], reserve: ['quoteId', 'idempotencyKey'], compete: [], edit: ['bookingId', 'guestId', 'consent', 'preferenceId'], validate: ['bookingId'], submit: ['bookingId', 'idempotencyKey'], settle: ['bookingId', 'eventId', 'sequence', 'status'], fulfill: ['bookingId'], release: ['bookingId'], void: ['bookingId'], receipt: ['idempotencyKey'], advance: ['seconds'], 'price-change': ['optionId', 'deltaMinor'], outbox: ['bookingId'], 'import-preview': ['rows'], 'import-commit': ['previewId'], reset: [] };
export function dispatch(input, action, options = {}) {
  let base = clone(input); if (!options.skipExpiry) expire(base);
  let work = clone(base), result;
  try {
    requireRule(action && typeof action === 'object' && !Array.isArray(action) && typeof action.type === 'string' && Object.hasOwn(actionFields, action.type), 'INVALID_ACTION', 'Use a known action with bounded synthetic fields.');
    requireRule(Object.keys(action).every(k => k === 'type' || actionFields[action.type].includes(k)), 'UNEXPECTED_FIELD', 'Arbitrary fields and personal uploads are not accepted.');
    result = { ok: true, code: 'OK', ...act(work, action, options) };
    if (result.reset) work = createState();
    audit(work, identifier(action?.type) ? action.type : 'invalid-action', result.code, identifier(action?.bookingId) ? action.bookingId : null);
    requireRule(new TextEncoder().encode(JSON.stringify(work)).byteLength <= LIMITS.stateBytes, 'STATE_LIMIT', 'The bounded synthetic state is full.');
    base = work;
  } catch (e) {
    result = { ok: false, code: e.code ?? 'INVALID_STATE', message: e.code ? e.message : 'Invalid synthetic state or resource identifiers.' };
    audit(base, identifier(action?.type) ? action.type : 'invalid-action', result.code, identifier(action?.bookingId) ? action.bookingId : null);
    while (base.audit.length && new TextEncoder().encode(JSON.stringify(base)).byteLength > LIMITS.stateBytes) base.audit.shift();
  }
  return { state: base, result: clone(result) };
}
export function publicState(state) { return clone(state); }
