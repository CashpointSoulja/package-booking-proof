# API grounding and independent contract

Ayo Ahmed — Independent concept for Trybe. Unofficial. All inventory, guests, orders and payments are synthetic. This implementation is not connected to Trybe and is not API-compatible with its contract.

I read the official API guides and endpoint references before implementing the shared domain rules on 13 October 2026. I use their concepts to frame the commercial slice, while making the demo's safeguards explicit. No vendor authentication, playground calls, signup, payment processor, message service or deployment was used.

| Official source | What it establishes | My independent implementation |
| --- | --- | --- |
| [Availability and booking](https://docs.try.be/guides/availability-and-booking) | Slot results are temporary snapshots; IDs require an offering-type discriminator; site and resource constraints matter. | Resources are keyed by site, offering type and ID; claims must match their displayed component intervals. Quotes bind revisions, times and authoritative prices, and expire after 60 simulated seconds. |
| [Basket and checkout](https://docs.try.be/guides/basket-and-checkout) | Basket edits, package choices, reservation, pre-submit validation and submission are separate steps. Settlement is a separate fulfillment signal. | A two-part package holds all three claims together for 120 simulated seconds, revalidates latest evidence and consent before submission, then waits for simulated settlement. |
| [OfferingAvailability](https://docs.try.be/endpoints/OfferingAvailability) | Monthly offering availability is a summary, with offering type and ID. | I distinguish a catalog choice from a concrete time/resource quote. Monthly calendar behavior is outside this slice. |
| [Sessions](https://docs.try.be/endpoints/Sessions) | Sessions are their own scheduling surface. | The second package component consumes shared-area capacity at its own interval. I do not pretend this synthetic schema reproduces a vendor session. |
| [Cloudflare SQLite storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) | SQLite Durable Objects support synchronous SQL and transaction callbacks with rollback on an exception. | One bounded visitor state row and its request-security row are read, checked and updated within `storage.transactionSync`, without external I/O inside the transaction. |

The guides describe a one-hour submit retry window; this concept instead records bounded reserve and submit receipts until the synthetic session expires or is explicitly reset. The guides describe customer attachment before reservation. This concept collects only a predefined synthetic guest and explicit synthetic consent after holding; it validates both before submission. A real integration would follow the vendor contract and permission model. These differences are design choices, not assertions about undocumented vendor guarantees.

## Runtime contract

The Worker serves local assets and four independent routes. These are demo routes, not Trybe endpoints.

| Route | Request | Response |
| --- | --- | --- |
| `GET /api/session` | Same-origin visitor, optional existing `pbp_session` cookie | `ok`, 32-byte random `token`, persisted `state`, runtime label; sets a visitor UUID cookie for a new session. |
| `GET /api/state` | Cookie and `X-Session-Token` | Latest state after expiry cleanup. |
| `POST /api/action` | Cookie, token, exact same-origin `Origin`, `application/json` action | `ok`, `code`, readable `message`, relevant booking/receipt/preview, and latest persisted `state`. |
| `GET /api/eval` | Cookie and token; optional `?broken=1` | Executed deterministic `evaluation` with expected/actual assertions. Broken mode changes only fresh evaluation fixtures, never visitor state. |

Domain failures return HTTP 409, malformed action fields 400, missing sessions 401, guard failures 403, size violations 413, incompatible content type 415 and request quotas 429. Static assets do not expose visitor state. HTTP responses disable caching and apply a same-origin Content Security Policy.

The pure shared exports are `createState()`, `dispatch(state, action, {skipExpiry:false})`, `publicState(state)`, `resourceKey(site, offeringType, id)`, `minorUnits(decimalString)`, `FIXED_CLOCK` and `LIMITS`. `dispatch` clones its input and returns `{state,result}`. The `skipExpiry` fault injection is test-only: HTTP never accepts it as an action field.

| Action | Accepted fields beyond `type` | Behavior |
| --- | --- | --- |
| `availability` | none | Returns quotes for both explicit options, including unavailability reasons. No capacity consumed. |
| `reserve` | `quoteId`, `idempotencyKey` | Atomically checks all three claims and records one hold and receipt. |
| `compete` | none | Creates a predefined synthetic competing reservation against the same visitor venue. |
| `edit` | `bookingId`, `guestId`, `consent`, `preferenceId` | Guest must be `synthetic-guest-01`, consent boolean, preference `quiet` or `none`. Invalidates validation. |
| `validate` | `bookingId` | Checks held status, latest resource/price evidence and synthetic consent; binds evidence to basket and state revisions. |
| `submit` | `bookingId`, `idempotencyKey` | Requires latest validation and creates one synthetic order ID with pending payment. Replay returns the original receipt. |
| `settle` | `bookingId`, `eventId`, positive integer `sequence`, `status` (`settled` or `failed`) | Simulates payment outcome. Duplicate events are suppressed and later events cannot regress terminal state. Failure releases claims into an owned exception. |
| `fulfill` | `bookingId` | Requires settled payment; duplicate fulfillment does not create a second effect. |
| `release` / `void` | `bookingId` | Release only holds. Void holds, submitted orders or unresolved failure/expiry; never settled/fulfilled orders. |
| `receipt` | original `idempotencyKey` | Looks up committed result; a missing receipt remains explicitly unknown. |
| `advance` | integer `seconds` (1–3600) | Advances only the fixed simulation clock, within one demo day, and releases expired claims. |
| `price-change` | `optionId`, integer `deltaMinor` | Bounded synthetic price mutation, never accepts a negative total. |
| `outbox` | `bookingId` | Records synthetic handoff only; no network delivery. Suppresses repeated booking/outcome delivery. |
| `import-preview` | `rows` | Validates all strict synthetic resource rows without changing inventory. |
| `import-commit` | `previewId` | Commits every row together if preview is unexpired and state revision unchanged. |
| `reset` | none | Clears demo business state; cookie, token and request budgets persist. |

A receipt binds its key to the complete normalized action fingerprint. Reusing a key with different evidence fails, even if no capacity would be consumed. Settlement event IDs are similarly bound to their payload. Ignored terminal/out-of-order events enter the bounded ledger so an event ID cannot later be repurposed.

## Atomicity and scope

Within a visitor, practitioner, room and shared-area claims are checked before any hold is written. Overlapping active reservations consume resource capacity. A failure discards the speculative transition; only expiry cleanup and the bounded failure audit persist. A single SQLite transaction contains that resulting state, security budget, receipts and synthetic outbox. There is no external side effect to reconcile. Capacity checking is conservative over an entire requested interval; it may decline an otherwise schedulable fragmented interval rather than risk overselling. The fixed fixtures have no fragmented intervals.

Visitor isolation is intentional: two visitors do not compete in a real shared venue. The `compete` control and concurrent HTTP requests within one visitor exercise contention. A real venue would need a shared site inventory authority, authenticated customer authorization, vendor-side availability reconciliation and a different data/privacy design. This concept proves a bounded independent booking transaction, not production readiness or vendor interoperability.

## Bounds and synthetic import

Domain state is capped at 128 KB, 24 bookings, 48 receipts, 64 settlement event IDs, 24 retained quotes, 80 retained audit entries, 36 resources, 12 import rows per preview and 12 synthetic outbox records. Handoffs are capped at three unique records per simulated minute. Duplicate handoffs are suppressed before rate-limit checks.

The HTTP body stream is capped at 16 KB. Persisted security applies 240 requests per real minute, 2,000 per session and a 24-hour real-time session lifetime. A reset cannot reset these security budgets. Cookie is HttpOnly and SameSite Strict, with Secure on HTTPS. The separate random session token is required for action/state/evaluation requests. The simulation clock never drives security expiry or request windows.

Import rows accept exactly these keys:

```json
[{"synthetic":true,"site":"site-a","offeringType":"room","id":"synthetic-room-03","capacity":1,"currency":"GBP"}]
```

`offeringType` may also be `practitioner` or `area_booking`. IDs must follow the bounded `synthetic-…` format, capacity is an integer between 0 and 12, and currency is GBP. Extra fields, names, contact details, duplicate keys and malformed rows fail the entire preview. Only predefined synthetic inventory is intended; the interface offers a generated sample rather than a file upload.

There is no global or IP budget for new anonymous sessions. A caller can repeatedly acquire fresh visitor objects; per-session limits do not prevent aggregate object/storage/cost abuse. A public pilot would need a reviewed creation budget and aggregate capacity/cost controls, alongside its approved destination and scoped credentials. No production readiness claim or public deployment is made here.
