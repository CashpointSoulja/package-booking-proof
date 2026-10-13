# Executed integrity evidence

Ayo Ahmed - Independent concept. All fixtures, guests, inventory, orders and settlement events are synthetic. This is an unofficial concept and is not connected to Trybe.

Generated from actual assertion artifacts on 2026-10-13T08:49:52.411Z. Every domain case starts from a new fixed-clock fixture; expiry advances simulation time without sleeping. The passing tests assert behavior, authoritative rejection reasons and invariant preservation. They do not claim commercial performance or causal uplift.

## Domain assertions shared with the UI

Executed command: `npm run test:domain`. The UI calls `GET /api/eval`; the real Worker imports `src/eval.js`, which dispatches through the same production `src/domain.js` used for booking actions. The UI renders each executed expected/actual assertion and scenario total.

**34/34 scenarios passed, 108 visible expected/actual assertions; 0 failed scenarios.**

Mutation control: the same evaluator with the actual domain `skipExpiry` fault injection produced **2 failed scenarios** (F04, F25). The normal suite requires that control to turn red. `GET /api/eval?broken=1` demonstrates the failure only in isolated evaluator fixtures; `POST /api/action` rejects attempts to pass `skipExpiry` to a visitor's booking.

| Scenario | Assertion | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| F01 Stale availability cannot reserve | Old snapshot is rejected | false | false | PASS |
| F01 Stale availability cannot reserve | Rejection identifies stale availability | STALE_QUOTE | STALE_QUOTE | PASS |
| F01 Stale availability cannot reserve | No second booking is written | 1 | 1 | PASS |
| F02 Competing reservations cannot consume final capacity twice | First reservation succeeds | true | true | PASS |
| F02 Competing reservations cannot consume final capacity twice | Second reservation fails | false | false | PASS |
| F02 Competing reservations cannot consume final capacity twice | Rejection identifies exhausted final capacity | CAPACITY_CONFLICT | CAPACITY_CONFLICT | PASS |
| F02 Competing reservations cannot consume final capacity twice | Only one booking owns capacity | 1 | 1 | PASS |
| F03 Unavailable component rejects the complete package atomically | Missing shared-area capacity rejects reservation | false | false | PASS |
| F03 Unavailable component rejects the complete package atomically | Rejection identifies a component capacity conflict | CAPACITY_CONFLICT | CAPACITY_CONFLICT | PASS |
| F03 Unavailable component rejects the complete package atomically | No treatment-only booking remains | 0 | 0 | PASS |
| F04 Expired hold releases all package resources | Hold expires using simulated time | expired | expired | PASS |
| F04 Expired hold releases all package resources | Replacement reservation can use released capacity | true | true | PASS |
| F05 Released hold cannot validate or submit | Validation of released hold fails | false | false | PASS |
| F05 Released hold cannot validate or submit | Submission of released hold fails | false | false | PASS |
| F05 Released hold cannot validate or submit | Capacity is available to another booking | true | true | PASS |
| F06 Duplicate reserve returns the original receipt | Retry succeeds | true | true | PASS |
| F06 Duplicate reserve returns the original receipt | Retry returns the same booking | booking-4 | booking-4 | PASS |
| F06 Duplicate reserve returns the original receipt | Retry does not duplicate capacity usage | 1 | 1 | PASS |
| F07 Unknown reserve response recovers by receipt lookup | Committed receipt is recoverable | true | true | PASS |
| F07 Unknown reserve response recovers by receipt lookup | Receipt identifies the original booking | booking-4 | booking-4 | PASS |
| F07 Unknown reserve response recovers by receipt lookup | Missing receipt remains unknown | false | false | PASS |
| F08 State revision change invalidates old evidence | Old revision cannot reserve | false | false | PASS |
| F08 State revision change invalidates old evidence | No booking is created from stale evidence | 0 | 0 | PASS |
| F09 Editing a validated basket invalidates validation | Validated booking can be edited | true | true | PASS |
| F09 Editing a validated basket invalidates validation | Edited basket requires new validation | false | false | PASS |
| F10 Resource identity separates sites and offering types | Same numeric identifier is distinct across sites | false | false | PASS |
| F10 Resource identity separates sites and offering types | Same numeric identifier is distinct across offering types | false | false | PASS |
| F10 Resource identity separates sites and offering types | Cross-site claim cannot borrow an unrelated resource | false | false | PASS |
| F10 Resource identity separates sites and offering types | Rejection identifies the cross-site claim | CROSS_SITE | CROSS_SITE | PASS |
| F10 Resource identity separates sites and offering types | Cross-site rejection is atomic | 0 | 0 | PASS |
| F11 Negative capacity cannot enter a booking | Negative resource capacity rejects booking | false | false | PASS |
| F11 Negative capacity cannot enter a booking | Rejection identifies invalid capacity | INVALID_CAPACITY | INVALID_CAPACITY | PASS |
| F11 Negative capacity cannot enter a booking | No negative-capacity booking is written | 0 | 0 | PASS |
| F12 Practitioner overlap blocks an otherwise distinct option | First overlapping booking succeeds | true | true | PASS |
| F12 Practitioner overlap blocks an otherwise distinct option | Second overlapping practitioner booking fails | false | false | PASS |
| F12 Practitioner overlap blocks an otherwise distinct option | The rejection is a capacity conflict, not malformed intervals | CAPACITY_CONFLICT | CAPACITY_CONFLICT | PASS |
| F12 Practitioner overlap blocks an otherwise distinct option | No partial alternative booking survives | 1 | 1 | PASS |
| F13 Mixed currencies cannot form a package total | Mixed-currency reservation is rejected | false | false | PASS |
| F13 Mixed currencies cannot form a package total | Rejection identifies the unsupported currency combination | MIXED_CURRENCY | MIXED_CURRENCY | PASS |
| F13 Mixed currencies cannot form a package total | Rejection is atomic | 0 | 0 | PASS |
| F14 Price revision fails explicitly instead of silently swapping | Original price cannot be reserved | false | false | PASS |
| F14 Price revision fails explicitly instead of silently swapping | New quote makes increased price visible | 11500 | 11500 | PASS |
| F14 Price revision fails explicitly instead of silently swapping | No alternate package is silently booked | 0 | 0 | PASS |
| F15 Integer minor units avoid floating-point rounding | Decimal 0.10 becomes ten pence | 10 | 10 | PASS |
| F15 Integer minor units avoid floating-point rounding | Decimal 12.34 becomes 1234 pence | 1234 | 1234 | PASS |
| F15 Integer minor units avoid floating-point rounding | Decimal sum is exact in minor units | 30 | 30 | PASS |
| F15 Integer minor units avoid floating-point rounding | Fractional minor unit is rejected instead of rounded | true | true | PASS |
| F16 Malformed import leaves the catalog unchanged | Malformed preview is rejected | false | false | PASS |
| F16 Malformed import leaves the catalog unchanged | Catalog does not change | true | true | PASS |
| F17 Missing synthetic guest consent blocks validation | Missing consent cannot validate | false | false | PASS |
| F17 Missing synthetic guest consent blocks validation | Missing consent cannot submit | false | false | PASS |
| F18 Premature submission requires latest validation | An unvalidated hold cannot submit | false | false | PASS |
| F18 Premature submission requires latest validation | Latest validation is the missing requirement | VALIDATION_REQUIRED | VALIDATION_REQUIRED | PASS |
| F18 Premature submission requires latest validation | Premature submission has no outbox side effect | 0 | 0 | PASS |
| F19 Duplicate submit returns one order and one receipt | First submit succeeds | true | true | PASS |
| F19 Duplicate submit returns one order and one receipt | Submit retry succeeds | true | true | PASS |
| F19 Duplicate submit returns one order and one receipt | Submit retry returns same receipt | receipt-10 | receipt-10 | PASS |
| F19 Duplicate submit returns one order and one receipt | Duplicate submit creates only one booking | 1 | 1 | PASS |
| F20 Submitted does not mean settled or fulfilled | Order is only submitted | submitted | submitted | PASS |
| F20 Submitted does not mean settled or fulfilled | Submission creates an order identifier | string | string | PASS |
| F20 Submitted does not mean settled or fulfilled | Submission leaves payment pending | pending | pending | PASS |
| F20 Submitted does not mean settled or fulfilled | Fulfillment before settlement is blocked | false | false | PASS |
| F20 Submitted does not mean settled or fulfilled | Premature fulfillment leaves status unchanged | submitted | submitted | PASS |
| F21 Failed settlement becomes an owned exception | Failure event is accepted | true | true | PASS |
| F21 Failed settlement becomes an owned exception | Failed payment enters exception state | exception | exception | PASS |
| F21 Failed settlement becomes an owned exception | Exception has an explicit operator owner | Demo operations lead | Demo operations lead | PASS |
| F21 Failed settlement becomes an owned exception | Failed payment cannot fulfill | false | false | PASS |
| F22 Duplicate and out-of-order settlement cannot regress state | Older failure cannot regress settled order | settled | settled | PASS |
| F22 Duplicate and out-of-order settlement cannot regress state | Settled order can fulfill once | true | true | PASS |
| F22 Duplicate and out-of-order settlement cannot regress state | Fulfillment state is explicit | fulfilled | fulfilled | PASS |
| F23 Repeated synthetic outbox delivery is suppressed | Synthetic handoff succeeds | true | true | PASS |
| F23 Repeated synthetic outbox delivery is suppressed | Duplicate handoff does not append delivery | 1 | 1 | PASS |
| F23 Repeated synthetic outbox delivery is suppressed | Duplicate delivery is safe | true | true | PASS |
| F24 Safe void releases inventory without fulfillment | Submitted synthetic order can be safely voided | true | true | PASS |
| F24 Safe void releases inventory without fulfillment | Voided order cannot fulfill | false | false | PASS |
| F24 Safe void releases inventory without fulfillment | Voided resources become available | true | true | PASS |
| F25 Expired validated hold cannot submit | Expiry invalidates validated checkout | false | false | PASS |
| F25 Expired validated hold cannot submit | No submitted order is resurrected | expired | expired | PASS |
| F26 Unknown identifiers cannot mutate another booking | Unknown booking release is rejected | false | false | PASS |
| F26 Unknown identifiers cannot mutate another booking | Existing booking is unaffected | true | true | PASS |
| F27 Idempotency key cannot be repurposed for another action | Key reuse with altered evidence is rejected | false | false | PASS |
| F27 Idempotency key cannot be repurposed for another action | Key conflict cannot create a booking | 1 | 1 | PASS |
| F28 Negative prices cannot create an authoritative quote | Price mutation cannot create a negative total | false | false | PASS |
| F28 Negative prices cannot create an authoritative quote | Authoritative total is unchanged | 11000 | 11000 | PASS |
| F29 Unrelated revision changes still require latest validation | Another valid package changes the shared inventory revision | true | true | PASS |
| F29 Unrelated revision changes still require latest validation | Submission checks the latest evidence revision | false | false | PASS |
| F29 Unrelated revision changes still require latest validation | Rejection requires renewed validation of shared inventory | VALIDATION_REQUIRED | VALIDATION_REQUIRED | PASS |
| F29 Unrelated revision changes still require latest validation | Rejected submission leaves the hold active | held | held | PASS |
| F30 Mixed valid and malformed import is all-or-nothing | One malformed row rejects the entire preview | false | false | PASS |
| F30 Mixed valid and malformed import is all-or-nothing | Neither row changes the catalog | true | true | PASS |
| F30 Mixed valid and malformed import is all-or-nothing | Rejected preview has no commit handle | null | null | PASS |
| F31 Synthetic import requires preview, explicit commit and current revision | Valid preview succeeds | true | true | PASS |
| F31 Synthetic import requires preview, explicit commit and current revision | Preview alone does not change inventory | 3 | 3 | PASS |
| F31 Synthetic import requires preview, explicit commit and current revision | Stale preview cannot commit | false | false | PASS |
| F31 Synthetic import requires preview, explicit commit and current revision | Stale commit leaves inventory unchanged | 3 | 3 | PASS |
| F31 Synthetic import requires preview, explicit commit and current revision | Fresh explicit commit succeeds | true | true | PASS |
| F31 Synthetic import requires preview, explicit commit and current revision | All preview rows are committed exactly once | 4 | 4 | PASS |
| F31 Synthetic import requires preview, explicit commit and current revision | Preview cannot commit twice | false | false | PASS |
| F32 Personal import fields are rejected | Extra personal field cannot enter the synthetic catalog | false | false | PASS |
| F32 Personal import fields are rejected | Personal import rejection changes no catalog data | true | true | PASS |
| F33 Synthetic outbox enforces per-minute and session caps | Fourth unique handoff in a minute is rejected | false | false | PASS |
| F33 Synthetic outbox enforces per-minute and session caps | Rate rejection does not append a delivery | 3 | 3 | PASS |
| F33 Synthetic outbox enforces per-minute and session caps | Fixed clock advance opens the next rate window | true | true | PASS |
| F33 Synthetic outbox enforces per-minute and session caps | Thirteenth session handoff is rejected | false | false | PASS |
| F33 Synthetic outbox enforces per-minute and session caps | Session delivery ledger remains bounded at twelve | 12 | 12 | PASS |
| F34 Claim intervals must match the displayed package component | Mismatched claim interval is rejected | false | false | PASS |
| F34 Claim intervals must match the displayed package component | Mismatch is identified as an invalid slot | INVALID_SLOT | INVALID_SLOT | PASS |
| F34 Claim intervals must match the displayed package component | Invalid interval creates no booking | 0 | 0 | PASS |

## Actual Worker HTTP and SQLite Durable Object evidence

Executed command: `node --test tests/runtime.test.mjs` with loopback network permission. Runtime under test: **Actual Cloudflare workerd via Miniflare 5.20261006.1-alpha · Worker HTTP · SQLite Durable Object**. **58/58 assertions passed.** The suite sends actual HTTP requests through workerd, concurrently reserves the final slot and restarts the process against the same on-disk SQLite persistence root. It uses the declared Worker entrypoint, ES modules, assets binding and `BookingSession` with SQLite storage. HTTP requests explicitly use `Connection: close` and consume their responses; the harness does not retry failed requests or mutations.

| Assertion | Expected | Actual | Result |
| --- | --- | --- | --- |
| Actual Worker serves its asset root over HTTP | 200 | 200 | PASS |
| Worker serves a restrictive CSP | true | true | PASS |
| Visitor session bootstrap succeeds | 200 | 200 | PASS |
| Session cookie is HttpOnly and SameSite Strict | true | true | PASS |
| Concurrent HTTP attempts have one winner and one conflict | [200,409] | [200,409] | PASS |
| SQLite transaction commits exactly one package booking | 1 | 1 | PASS |
| Winning package owns practitioner, room and area together | 3 | 3 | PASS |
| Every claimed resource remains within authoritative capacity | true | true | PASS |
| Unknown-response lookup recovers winning HTTP booking | booking-4 | booking-4 | PASS |
| HTTP idempotent retry recovers the same booking | booking-4 | booking-4 | PASS |
| HTTP duplicate reserve preserves one booking | 1 | 1 | PASS |
| Visitor session bootstrap succeeds | 200 | 200 | PASS |
| Reload retains the visitor token | true | true | PASS |
| Reload retains the authoritative held booking | booking-4 | booking-4 | PASS |
| Visitor session bootstrap succeeds | 200 | 200 | PASS |
| Another visitor begins with separate inventory state | 0 | 0 | PASS |
| Another visitor has a distinct session token | false | false | PASS |
| A token cannot authenticate another visitor cookie | 403 | 403 | PASS |
| An endpoint without a visitor session is rejected | 401 | 401 | PASS |
| An invalid token is rejected | 403 | 403 | PASS |
| Hostile Origin cannot mutate booking state | 403 | 403 | PASS |
| Missing POST Origin cannot mutate booking state | 403 | 403 | PASS |
| Cross-site fetch metadata is rejected | 403 | 403 | PASS |
| Wrong content type is rejected | 415 | 415 | PASS |
| JSON null is an invalid action rather than a state read | 400 | 400 | PASS |
| Malformed JSON cannot enter domain state | 400 | 400 | PASS |
| Oversized declared body is rejected | 413 | 413 | PASS |
| Oversized chunked body is rejected without a declared length | 413 | 413 | PASS |
| Unknown action type is rejected at the real Worker | 400 | 400 | PASS |
| Client cannot supply an authoritative price override | 400 | 400 | PASS |
| Client cannot inject the test-only expiry option | 400 | 400 | PASS |
| Rejected hostile requests retain the held booking | held | held | PASS |
| HTTP stale quote rejects changed authoritative price | 409 | 409 | PASS |
| HTTP stale quote creates no booking | 0 | 0 | PASS |
| HTTP mixed valid/invalid import rejects atomically | 409 | 409 | PASS |
| HTTP malformed import changes no catalog rows | true | true | PASS |
| HTTP personal field import is rejected | 409 | 409 | PASS |
| HTTP preview leaves inventory unchanged until commit | true | true | PASS |
| HTTP explicit synthetic commit succeeds | 200 | 200 | PASS |
| HTTP synthetic commit appends exactly one resource | 4 | 4 | PASS |
| HTTP fixed simulation advance expires the hold | expired | expired | PASS |
| HTTP expired inventory becomes available again | 200 | 200 | PASS |
| HTTP submitted order cannot fulfill before settlement | 409 | 409 | PASS |
| HTTP duplicate/out-of-order settlement preserves settled state | settled | settled | PASS |
| Worker executes all shared domain scenarios | 0 | 0 | PASS |
| Worker broken-rule injection turns shared evidence red | true | true | PASS |
| Visitor session bootstrap succeeds | 200 | 200 | PASS |
| Allowed requests fit the per-minute quota | true | true | PASS |
| Reset succeeds at the final request in the quota | 200 | 200 | PASS |
| Reset cannot erase the request quota | 429 | 429 | PASS |
| Visitor session bootstrap succeeds | 200 | 200 | PASS |
| One visitor hitting the request cap does not throttle another | 200 | 200 | PASS |
| Visitor session bootstrap succeeds | 200 | 200 | PASS |
| Actual workerd restart restores the visitor token from SQLite | true | true | PASS |
| Actual workerd restart restores booking and settlement ledger | true | true | PASS |
| Actual workerd restart restores import catalog independently | 4 | 4 | PASS |
| Actual workerd restart preserves per-visitor request limits | 429 | 429 | PASS |
| Receipt recovery still succeeds after runtime restart | booking-22 | booking-22 | PASS |

## Deterministic security-clock evidence

Executed command: `node --test tests/http.test.mjs`. The shared HTTP guard accepts an explicit clock in these unit tests. They exhaust 2,000 lifetime requests across simulated minute windows and expire a visitor at exactly 24 hours; no real-time sleeps or expiry waits are used. **6/6 assertions passed.**

| Assertion | Expected | Actual | Result |
| --- | --- | --- | --- |
| Security admits exactly the bounded lifetime request budget | 2000 | 2000 | PASS |
| New minute cannot bypass the lifetime request budget | 429 | 429 | PASS |
| Fixed security clock expires a session at exactly 24 hours | 401 | 401 | PASS |
| Expired session does not consume another request | 0 | 0 | PASS |
| Wrong visitor token is rejected before charging the quota | 403 | 403 | PASS |
| Wrong token cannot consume another visitors request allowance | 0 | 0 | PASS |

## Transport finding

An earlier full-suite run stopped with Undici `UND_ERR_SOCKET: other side closed` on a pooled connection immediately after the hostile-Origin POST had returned 403. The following missing-Origin assertion had not executed, and the runtime artifact was absent, so that run was not reported as passing. The harness now explicitly closes each HTTP connection and consumes the asset body instead of reusing a connection that an early unread-body rejection may close. No application guard was changed and no request was retried. The complete suite was then executed twice successfully. This evidence covers that explicit transport; it does not claim keep-alive transport behavior has been validated.

## Scope and limitations

This evidence proves the local Cloudflare workerd/SQLite Durable Object implementation and its tested guards. It does not prove a publicly deployed account's configuration, HTTPS cookie behavior in a live browser, vendor compatibility, production scale, real payment processing or real guest outcomes. No public deployment, live vendor API or outbound messaging was used. A public destination and scoped deployment authorization are absent.

Per-session quotas survive domain reset and runtime restart. Creating a new visitor cookie remains outside a global/IP budget, so these bounds do not prevent an attacker creating many new Durable Objects; that remains a candid aggregate abuse and operating-cost risk documented in the recovery architecture. The current public deployment gates are an owner-approved destination and scoped Cloudflare authorization. A visitor's competitors share that visitor's synthetic inventory; independent visitors intentionally own separate synthetic venues.

Pixel widths and browser workflow evidence are recorded separately under `docs/pixel-proof/`. Reproduce the integrity evidence with `npm ci`, `npm test`, then `node tests/report.mjs`. The managed environment requires its supported loopback/network permission when starting workerd; this is an environment constraint, not an application guard bypass.
