import { createState, dispatch, resourceKey, minorUnits } from './domain.js';

// The browser evidence panel and Node suite execute the production domain module.
// All fixtures are synthetic, and each scenario begins at the fixed simulation clock.
export function runEvaluation({ injectBrokenRule = false } = {}) {
  const cases = [];
  let assertionCount = 0;
  const scenario = (id, name, run) => {
    const assertions = [];
    const check = (label, actual, expected) => {
      const passed = JSON.stringify(actual) === JSON.stringify(expected);
      assertions.push({ label, expected, actual, passed });
      assertionCount++;
    };
    const ctx = {
      state: createState(),
      act(action) {
        const next = dispatch(this.state, action, { skipExpiry: injectBrokenRule });
        this.state = next.state;
        return next.result;
      },
      quote(optionId = 'standard') {
        const result = this.act({ type: 'availability' });
        return result.quotes.find(q => q.optionId === optionId);
      },
      reserve(key = 'reserve-a', optionId = 'standard') {
        const quote = this.quote(optionId);
        return this.act({ type: 'reserve', quoteId: quote.id, idempotencyKey: key });
      },
      held() { const r = this.reserve(); return r.booking.id; },
      prepared() {
        const bookingId = this.held();
        this.act({ type: 'edit', bookingId, guestId: 'synthetic-guest-01', consent: true, preferenceId: 'quiet' });
        this.act({ type: 'validate', bookingId });
        return bookingId;
      },
      submitted() {
        const bookingId = this.prepared();
        this.act({ type: 'submit', bookingId, idempotencyKey: 'submit-a' });
        return bookingId;
      },
      booking(id) { return this.state.bookings.find(b => b.id === id); }
    };
    try { run(ctx, check); }
    catch (error) { check('Scenario executes without an unexpected exception', String(error.message), null); }
    if (!assertions.length) check('Scenario contains evidence', 0, 1);
    cases.push({ id, name, passed: assertions.every(a => a.passed), assertions });
  };

  scenario('F01', 'Stale availability cannot reserve', (c, a) => {
    const q = c.quote(); c.act({ type: 'compete' });
    const r = c.act({ type: 'reserve', quoteId: q.id, idempotencyKey: 'stale' });
    a('Old snapshot is rejected', r.ok, false);
    a('Rejection identifies stale availability', r.code, 'STALE_QUOTE');
    a('No second booking is written', c.state.bookings.length, 1);
  });
  scenario('F02', 'Competing reservations cannot consume final capacity twice', (c, a) => {
    const first = c.reserve('first'); const second = c.reserve('second');
    a('First reservation succeeds', first.ok, true);
    a('Second reservation fails', second.ok, false);
    a('Rejection identifies exhausted final capacity', second.code, 'CAPACITY_CONFLICT');
    a('Only one booking owns capacity', c.state.bookings.length, 1);
  });
  scenario('F03', 'Unavailable component rejects the complete package atomically', (c, a) => {
    const q = c.quote();
    const option = c.state.catalog.options.find(o => o.id === 'standard');
    const key = option.parts[1].claims[0].key;
    c.state.catalog.resources.find(r => r.key === key).capacity = 0;
    const r = c.act({ type: 'reserve', quoteId: q.id, idempotencyKey: 'unavailable' });
    a('Missing shared-area capacity rejects reservation', r.ok, false);
    a('Rejection identifies a component capacity conflict', r.code, 'CAPACITY_CONFLICT');
    a('No treatment-only booking remains', c.state.bookings.length, 0);
  });
  scenario('F04', 'Expired hold releases all package resources', (c, a) => {
    const id = c.held(); c.act({ type: 'advance', seconds: 601 });
    a('Hold expires using simulated time', c.booking(id).status, 'expired');
    a('Replacement reservation can use released capacity', c.reserve('replacement').ok, true);
  });
  scenario('F05', 'Released hold cannot validate or submit', (c, a) => {
    const id = c.held(); c.act({ type: 'release', bookingId: id });
    a('Validation of released hold fails', c.act({ type: 'validate', bookingId: id }).ok, false);
    a('Submission of released hold fails', c.act({ type: 'submit', bookingId: id, idempotencyKey: 'released' }).ok, false);
    a('Capacity is available to another booking', c.reserve('after-release').ok, true);
  });
  scenario('F06', 'Duplicate reserve returns the original receipt', (c, a) => {
    const q = c.quote(); const action = { type: 'reserve', quoteId: q.id, idempotencyKey: 'same-reserve' };
    const first = c.act(action); const retry = c.act(action);
    a('Retry succeeds', retry.ok, true);
    a('Retry returns the same booking', retry.booking.id, first.booking.id);
    a('Retry does not duplicate capacity usage', c.state.bookings.length, 1);
  });
  scenario('F07', 'Unknown reserve response recovers by receipt lookup', (c, a) => {
    const r = c.reserve('lost-response'); const recovered = c.act({ type: 'receipt', idempotencyKey: 'lost-response' });
    a('Committed receipt is recoverable', recovered.ok, true);
    a('Receipt identifies the original booking', recovered.receipt.bookingId, r.booking.id);
    a('Missing receipt remains unknown', c.act({ type: 'receipt', idempotencyKey: 'never-sent' }).ok, false);
  });
  scenario('F08', 'State revision change invalidates old evidence', (c, a) => {
    const q = c.quote(); c.act({ type: 'price-change', optionId: 'alternative', deltaMinor: 100 });
    a('Old revision cannot reserve', c.act({ type: 'reserve', quoteId: q.id, idempotencyKey: 'old-revision' }).ok, false);
    a('No booking is created from stale evidence', c.state.bookings.length, 0);
  });
  scenario('F09', 'Editing a validated basket invalidates validation', (c, a) => {
    const id = c.prepared();
    a('Validated booking can be edited', c.act({ type: 'edit', bookingId: id, guestId: 'synthetic-guest-01', consent: true, preferenceId: 'none' }).ok, true);
    a('Edited basket requires new validation', c.act({ type: 'submit', bookingId: id, idempotencyKey: 'edited' }).ok, false);
  });
  scenario('F10', 'Resource identity separates sites and offering types', (c, a) => {
    a('Same numeric identifier is distinct across sites', resourceKey('site-a', 'room', '1') === resourceKey('site-b', 'room', '1'), false);
    a('Same numeric identifier is distinct across offering types', resourceKey('site-a', 'room', '1') === resourceKey('site-a', 'practitioner', '1'), false);
    const q = c.quote();
    const option = c.state.catalog.options.find(o => o.id === 'standard');
    option.parts[0].claims[0].key = resourceKey('wrong-site', 'practitioner', '1');
    const result = c.act({ type: 'reserve', quoteId: q.id, idempotencyKey: 'cross-site' });
    a('Cross-site claim cannot borrow an unrelated resource', result.ok, false);
    a('Rejection identifies the cross-site claim', result.code, 'CROSS_SITE');
    a('Cross-site rejection is atomic', c.state.bookings.length, 0);
  });
  scenario('F11', 'Negative capacity cannot enter a booking', (c, a) => {
    const q = c.quote();
    const key = c.state.catalog.options[0].parts[0].claims[0].key;
    c.state.catalog.resources.find(r => r.key === key).capacity = -1;
    const result = c.act({ type: 'reserve', quoteId: q.id, idempotencyKey: 'negative' });
    a('Negative resource capacity rejects booking', result.ok, false);
    a('Rejection identifies invalid capacity', result.code, 'INVALID_CAPACITY');
    a('No negative-capacity booking is written', c.state.bookings.length, 0);
  });
  scenario('F12', 'Practitioner overlap blocks an otherwise distinct option', (c, a) => {
    const standard = c.state.catalog.options.find(o => o.id === 'standard');
    const alternative = c.state.catalog.options.find(o => o.id === 'alternative');
    alternative.parts[0].start = standard.parts[0].start;
    alternative.parts[0].end = standard.parts[0].end;
    alternative.parts[0].claims = alternative.parts[0].claims.map(claim => ({ ...claim, start: standard.parts[0].start, end: standard.parts[0].end }));
    a('First overlapping booking succeeds', c.reserve('first').ok, true);
    const conflict = c.reserve('overlap', 'alternative');
    a('Second overlapping practitioner booking fails', conflict.ok, false);
    a('The rejection is a capacity conflict, not malformed intervals', conflict.code, 'CAPACITY_CONFLICT');
    a('No partial alternative booking survives', c.state.bookings.length, 1);
  });
  scenario('F13', 'Mixed currencies cannot form a package total', (c, a) => {
    const q = c.quote();
    c.state.catalog.options.find(o => o.id === 'standard').parts[1].currency = 'EUR';
    const result = c.act({ type: 'reserve', quoteId: q.id, idempotencyKey: 'mixed' });
    a('Mixed-currency reservation is rejected', result.ok, false);
    a('Rejection identifies the unsupported currency combination', result.code, 'MIXED_CURRENCY');
    a('Rejection is atomic', c.state.bookings.length, 0);
  });
  scenario('F14', 'Price revision fails explicitly instead of silently swapping', (c, a) => {
    const q = c.quote(); c.act({ type: 'price-change', optionId: 'standard', deltaMinor: 500 });
    a('Original price cannot be reserved', c.act({ type: 'reserve', quoteId: q.id, idempotencyKey: 'old-price' }).ok, false);
    const updated = c.quote();
    a('New quote makes increased price visible', updated.totalMinor, q.totalMinor + 500);
    a('No alternate package is silently booked', c.state.bookings.length, 0);
  });
  scenario('F15', 'Integer minor units avoid floating-point rounding', (c, a) => {
    a('Decimal 0.10 becomes ten pence', minorUnits('0.10'), 10);
    a('Decimal 12.34 becomes 1234 pence', minorUnits('12.34'), 1234);
    a('Decimal sum is exact in minor units', minorUnits('0.10') + minorUnits('0.20'), 30);
    let rejected = false; try { minorUnits('1.005'); } catch { rejected = true; }
    a('Fractional minor unit is rejected instead of rounded', rejected, true);
  });
  scenario('F16', 'Malformed import leaves the catalog unchanged', (c, a) => {
    const before = JSON.stringify(c.state.catalog);
    const r = c.act({ type: 'import-preview', rows: [{ site: 'site-a', offeringType: 'room', id: 'x', capacity: -2, synthetic: true }] });
    a('Malformed preview is rejected', r.ok, false);
    a('Catalog does not change', JSON.stringify(c.state.catalog) === before, true);
  });
  scenario('F17', 'Missing synthetic guest consent blocks validation', (c, a) => {
    const id = c.held(); c.act({ type: 'edit', bookingId: id, guestId: 'synthetic-guest-01', consent: false, preferenceId: 'quiet' });
    a('Missing consent cannot validate', c.act({ type: 'validate', bookingId: id }).ok, false);
    a('Missing consent cannot submit', c.act({ type: 'submit', bookingId: id, idempotencyKey: 'no-consent' }).ok, false);
  });
  scenario('F18', 'Premature submission requires latest validation', (c, a) => {
    const id = c.held();
    c.act({ type: 'edit', bookingId: id, guestId: 'synthetic-guest-01', consent: true, preferenceId: 'quiet' });
    const result = c.act({ type: 'submit', bookingId: id, idempotencyKey: 'premature' });
    a('An unvalidated hold cannot submit', result.ok, false);
    a('Latest validation is the missing requirement', result.code, 'VALIDATION_REQUIRED');
    a('Premature submission has no outbox side effect', c.state.outbox.length, 0);
  });
  scenario('F19', 'Duplicate submit returns one order and one receipt', (c, a) => {
    const id = c.prepared(); const action = { type: 'submit', bookingId: id, idempotencyKey: 'submit-same' };
    const first = c.act(action); const retry = c.act(action);
    a('First submit succeeds', first.ok, true); a('Submit retry succeeds', retry.ok, true);
    a('Submit retry returns same receipt', retry.receipt.id, first.receipt.id);
    a('Duplicate submit creates only one booking', c.state.bookings.length, 1);
  });
  scenario('F20', 'Submitted does not mean settled or fulfilled', (c, a) => {
    const id = c.submitted();
    a('Order is only submitted', c.booking(id).status, 'submitted');
    a('Submission creates an order identifier', typeof c.booking(id).orderId, 'string');
    a('Submission leaves payment pending', c.booking(id).paymentStatus, 'pending');
    a('Fulfillment before settlement is blocked', c.act({ type: 'fulfill', bookingId: id }).ok, false);
    a('Premature fulfillment leaves status unchanged', c.booking(id).status, 'submitted');
  });
  scenario('F21', 'Failed settlement becomes an owned exception', (c, a) => {
    const id = c.submitted(); const r = c.act({ type: 'settle', bookingId: id, eventId: 'failed-1', sequence: 1, status: 'failed' });
    a('Failure event is accepted', r.ok, true);
    a('Failed payment enters exception state', c.booking(id).status, 'exception');
    a('Exception has an explicit operator owner', c.booking(id).exception.owner, 'Demo operations lead');
    a('Failed payment cannot fulfill', c.act({ type: 'fulfill', bookingId: id }).ok, false);
  });
  scenario('F22', 'Duplicate and out-of-order settlement cannot regress state', (c, a) => {
    const id = c.submitted(); const event = { type: 'settle', bookingId: id, eventId: 'settled-2', sequence: 2, status: 'settled' };
    c.act(event); c.act(event);
    c.act({ type: 'settle', bookingId: id, eventId: 'late-failed-1', sequence: 1, status: 'failed' });
    a('Older failure cannot regress settled order', c.booking(id).status, 'settled');
    a('Settled order can fulfill once', c.act({ type: 'fulfill', bookingId: id }).ok, true);
    a('Fulfillment state is explicit', c.booking(id).status, 'fulfilled');
  });
  scenario('F23', 'Repeated synthetic outbox delivery is suppressed', (c, a) => {
    const id = c.submitted(); const first = c.act({ type: 'outbox', bookingId: id });
    const count = c.state.outbox.length; const retry = c.act({ type: 'outbox', bookingId: id });
    a('Synthetic handoff succeeds', first.ok, true);
    a('Duplicate handoff does not append delivery', c.state.outbox.length, count);
    a('Duplicate delivery is safe', retry.ok, true);
  });
  scenario('F24', 'Safe void releases inventory without fulfillment', (c, a) => {
    const id = c.submitted();
    a('Submitted synthetic order can be safely voided', c.act({ type: 'void', bookingId: id }).ok, true);
    a('Voided order cannot fulfill', c.act({ type: 'fulfill', bookingId: id }).ok, false);
    a('Voided resources become available', c.reserve('after-void').ok, true);
  });
  scenario('F25', 'Expired validated hold cannot submit', (c, a) => {
    const id = c.prepared(); c.act({ type: 'advance', seconds: 601 });
    a('Expiry invalidates validated checkout', c.act({ type: 'submit', bookingId: id, idempotencyKey: 'expired-submit' }).ok, false);
    a('No submitted order is resurrected', c.booking(id).status, 'expired');
  });
  scenario('F26', 'Unknown identifiers cannot mutate another booking', (c, a) => {
    const id = c.held(); const before = JSON.stringify(c.booking(id));
    a('Unknown booking release is rejected', c.act({ type: 'release', bookingId: 'missing-booking' }).ok, false);
    a('Existing booking is unaffected', JSON.stringify(c.booking(id)) === before, true);
  });
  scenario('F27', 'Idempotency key cannot be repurposed for another action', (c, a) => {
    const q = c.quote(); c.act({ type: 'reserve', quoteId: q.id, idempotencyKey: 'shared-key' });
    a('Key reuse with altered evidence is rejected', c.act({ type: 'reserve', quoteId: 'different-quote', idempotencyKey: 'shared-key' }).ok, false);
    a('Key conflict cannot create a booking', c.state.bookings.length, 1);
  });
  scenario('F28', 'Negative prices cannot create an authoritative quote', (c, a) => {
    const before = c.state.catalog.options.find(o => o.id === 'standard').totalMinor;
    a('Price mutation cannot create a negative total', c.act({ type: 'price-change', optionId: 'standard', deltaMinor: -(before + 1) }).ok, false);
    a('Authoritative total is unchanged', c.state.catalog.options.find(o => o.id === 'standard').totalMinor, before);
  });

  scenario('F29', 'Unrelated revision changes still require latest validation', (c, a) => {
    const id = c.prepared();
    a('Another valid package changes the shared inventory revision', c.reserve('latest-other', 'alternative').ok, true);
    const result = c.act({ type: 'submit', bookingId: id, idempotencyKey: 'stale-validation' });
    a('Submission checks the latest evidence revision', result.ok, false);
    a('Rejection requires renewed validation of shared inventory', result.code, 'VALIDATION_REQUIRED');
    a('Rejected submission leaves the hold active', c.booking(id).status, 'held');
  });
  scenario('F30', 'Mixed valid and malformed import is all-or-nothing', (c, a) => {
    const before = JSON.stringify(c.state.catalog);
    const valid = { synthetic: true, site: 'site-a', offeringType: 'room', id: 'synthetic-room-03', capacity: 1, currency: 'GBP' };
    const result = c.act({ type: 'import-preview', rows: [valid, { ...valid, id: 'synthetic-room-04', capacity: -1 }] });
    a('One malformed row rejects the entire preview', result.ok, false);
    a('Neither row changes the catalog', JSON.stringify(c.state.catalog) === before, true);
    a('Rejected preview has no commit handle', c.state.importPreview, null);
  });
  scenario('F31', 'Synthetic import requires preview, explicit commit and current revision', (c, a) => {
    const row = { synthetic: true, site: 'site-a', offeringType: 'room', id: 'synthetic-room-03', capacity: 1, currency: 'GBP' };
    const initial = c.state.catalog.resources.length;
    const preview = c.act({ type: 'import-preview', rows: [row] });
    a('Valid preview succeeds', preview.ok, true);
    a('Preview alone does not change inventory', c.state.catalog.resources.length, initial);
    c.act({ type: 'price-change', optionId: 'alternative', deltaMinor: 100 });
    a('Stale preview cannot commit', c.act({ type: 'import-commit', previewId: preview.previewId }).ok, false);
    a('Stale commit leaves inventory unchanged', c.state.catalog.resources.length, initial);
    const fresh = c.act({ type: 'import-preview', rows: [row] });
    a('Fresh explicit commit succeeds', c.act({ type: 'import-commit', previewId: fresh.previewId }).ok, true);
    a('All preview rows are committed exactly once', c.state.catalog.resources.length, initial + 1);
    a('Preview cannot commit twice', c.act({ type: 'import-commit', previewId: fresh.previewId }).ok, false);
  });
  scenario('F32', 'Personal import fields are rejected', (c, a) => {
    const before = JSON.stringify(c.state.catalog);
    const row = { synthetic: true, site: 'site-a', offeringType: 'room', id: 'synthetic-room-03', capacity: 1, currency: 'GBP', name: 'PERSONAL_UPLOAD_FORBIDDEN' };
    a('Extra personal field cannot enter the synthetic catalog', c.act({ type: 'import-preview', rows: [row] }).ok, false);
    a('Personal import rejection changes no catalog data', JSON.stringify(c.state.catalog) === before, true);
  });
  scenario('F33', 'Synthetic outbox enforces per-minute and session caps', (c, a) => {
    const makeException = index => {
      const id = c.reserve(`reserve-${index}`).booking.id;
      c.act({ type: 'edit', bookingId: id, guestId: 'synthetic-guest-01', consent: true, preferenceId: 'quiet' });
      c.act({ type: 'validate', bookingId: id });
      c.act({ type: 'submit', bookingId: id, idempotencyKey: `submit-${index}` });
      c.act({ type: 'settle', bookingId: id, eventId: `failed-${index}`, sequence: 1, status: 'failed' });
      return id;
    };
    for (let i = 0; i < 3; i++) {
      const id = makeException(i); c.act({ type: 'outbox', bookingId: id }); c.act({ type: 'void', bookingId: id });
    }
    const fourth = makeException(3);
    a('Fourth unique handoff in a minute is rejected', c.act({ type: 'outbox', bookingId: fourth }).ok, false);
    a('Rate rejection does not append a delivery', c.state.outbox.length, 3);
    c.act({ type: 'advance', seconds: 61 });
    a('Fixed clock advance opens the next rate window', c.act({ type: 'outbox', bookingId: fourth }).ok, true);
    c.act({ type: 'void', bookingId: fourth });
    for (let i = 4; i < 12; i++) {
      c.act({ type: 'advance', seconds: 61 });
      const id = makeException(i); c.act({ type: 'outbox', bookingId: id }); c.act({ type: 'void', bookingId: id });
    }
    c.act({ type: 'advance', seconds: 61 });
    const final = makeException(12);
    a('Thirteenth session handoff is rejected', c.act({ type: 'outbox', bookingId: final }).ok, false);
    a('Session delivery ledger remains bounded at twelve', c.state.outbox.length, 12);
  });

  scenario('F34', 'Claim intervals must match the displayed package component', (c, a) => {
    const q = c.quote();
    const option = c.state.catalog.options.find(o => o.id === 'standard');
    option.parts[0].claims[0].start += 60000;
    const result = c.act({ type: 'reserve', quoteId: q.id, idempotencyKey: 'interval-mismatch' });
    a('Mismatched claim interval is rejected', result.ok, false);
    a('Mismatch is identified as an invalid slot', result.code, 'INVALID_SLOT');
    a('Invalid interval creates no booking', c.state.bookings.length, 0);
  });

  const passed = cases.filter(c => c.passed).length;
  return { passed, failed: cases.length - passed, total: cases.length, assertions: assertionCount, cases };
}
