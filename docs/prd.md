# Package Booking Proof — product requirements

**Ayo Ahmed — Independent concept for Trybe. Unofficial.**

All guests, inventory, orders and payments in this proof are synthetic. It is not connected to Trybe. I have not verified an open role at Trybe, interviewed its customers or measured its commercial performance. This is my independent product judgment about a narrow booking problem, informed by public product material and an executable simulation.

## My 30-second story

I want a guest to book a wellness package that needs a treatment room, a practitioner and a later shared-area session without accidentally buying only part of the experience. I show an availability snapshot, reserve every component together for a short time, and check the latest evidence before submission. If capacity disappears, the price changes or payment fails, I explain the problem and give the guest or operator a clear recovery action. A submitted order remains unfulfilled until simulated settlement succeeds.

## Explain it to a five-year-old

Imagine a party needs a room, a helper and a pool seat. Seeing all three available does not mean they will still be there when you finish choosing. I briefly put all three aside together. If one cannot be held, I put none aside. If the timer runs out, I give them back. I ask again before changing the time or price, and I only say the booking is ready when the pretend payment finishes.

## Why I chose this problem

Trybe's public material describes hospitality booking software and dynamic packages. That makes coordination between components a plausible product problem. It does not establish the frequency, severity or financial cost of this particular problem for Trybe customers. My source boundaries and exact source links are in [API grounding](api-grounding.md) and [brand guide](brand-guide.md).

| Official context read on 13 October 2026 | What it supports | What I do not infer |
| --- | --- | --- |
| [About](https://try.be/about) says over 400 properties across **33 countries**. | A vendor-described multi-property, multi-market operating context. | Independently audited scale or usage of my concept. |
| [Dynamic Packages](https://try.be/dynamic-packages) describes components with their own availability, booked together, with overlap prevention. | Coupled package choice is a relevant product domain. | That my atomic hold or receipt contract is a Trybe implementation. |
| [Waitlists](https://try.be/waitlists) describes manual treatment waitlists and automatic class promotion. | Different service types need different recovery ownership. | That this concept implements waitlist promotion or sends notifications. |
| [Official Series A article](https://try.be/blog/trybe-five-elms-capital) announces $30 million USD in January 2026 and geographic/product expansion. | Public commercial context for studying operations and payment-state clarity. | A verified vacancy, partner relationship or committed roadmap for this work. |
| [Availability guide](https://docs.try.be/guides/availability-and-booking) and [checkout guide](https://docs.try.be/guides/basket-and-checkout) discuss ephemeral availability, conflict, pre-submit checks and submitted versus settled orders. | Useful public domain concepts for my state model. | Vendor API compatibility, real integration or permission to use protected assets. |

I chose package integrity over breadth because one failed component can invalidate the guest's intended visit. Reducing clicks is useful only when the resulting promise is reliable. I would first verify whether guests and operators experience enough avoidable rework to justify adding a coordinated package hold.

## Users and jobs

| User | Job I am designing for | Observable success |
| --- | --- | --- |
| Guest | “When I choose a complete visit, help me obtain its components together so I can commit with confidence.” | Guest sees the exact time and total, deliberately accepts changes, and can recover an uncertain result. |
| Front-desk/operator | “When a booking fails, tell me what is owned, what is released and what I need to do so I can resolve it.” | Exception has an order reference, reason, state and bounded next action; no manual guess about payment or capacity. |
| Venue manager | “When I sell packages, protect scarce resources so I can use capacity without breaking service promises.” | No cross-site allocation, over-allocation or practitioner overlap under the tested rules. |

These jobs are hypotheses, not customer quotations. I use them to design research and acceptance checks.

## Scope and outcome

The sole commercial slice is a two-part wellness package: a treatment that requires a practitioner and room, followed by a shared-area session. I scope the proof to fixed synthetic inventory, a fixed simulation clock and visitor-isolated state. A hold expires; availability is evidence with a revision, not a guarantee. Payment is simulated. An exception can be handed off through an in-product synthetic queue.

I will judge the proof by whether its tested state transitions preserve the complete package and explain recovery. I will judge a future product pilot by task success, operator rework, capacity integrity and the cost of time spent holding scarce resources. I have no live baseline or measured conversion uplift.

### Non-goals

I am not replacing Trybe, claiming its API contract, selling inventory, charging a guest, uploading personal information, sending live notifications or building a general hotel PMS. Memberships, discounts, taxes, split payments, refunds, real guest identity, actual staffing qualifications and production calendars are outside this proof. I do not claim distributed production exactly-once delivery from a synthetic outbox.

## Requirements and acceptance

| Priority | Requirement | Acceptance I expect to inspect |
| --- | --- | --- |
| P0 | Availability records the package components, resource identities, currency, integer minor-unit total and revision. | Selected treatment and shared session are visible; no price is calculated from an untrusted client total. |
| P0 | Reserve all required resources atomically. | A competing request for final capacity gets a conflict; the unsuccessful request owns no partial package. |
| P0 | A held package expires and releases capacity. | A request after the fixed-clock expiry cannot submit the expired hold; subsequent eligible requests can reuse released capacity. |
| P0 | Validate against the latest quote and state before submit. | Stale availability, stale revision, price change and an edited selection block submission until the guest follows an explicit recovery path. |
| P0 | Preserve identities across site and offering type. | Equal raw IDs at different sites or offering types cannot alias inventory. |
| P0 | Preserve service integrity. | Negative capacity, practitioner overlap, unsupported mixed currencies and an unavailable component fail under the same rules used by the server. |
| P0 | Keep submission distinct from settlement. | Submitted order has a separate pending status; it cannot be fulfilled before simulated settlement. Failed settlement creates an owned exception. |
| P0 | Make retries safe. | Repeating reserve or submit with the same idempotency key returns the existing receipt. Receipt lookup recovers a request whose response was lost. Duplicate or out-of-order settlement cannot repeat fulfillment/outbox effects. |
| P0 | Make recovery understandable and accessible. | Expiry, conflict, change, unknown result and failure show the current state and an available action; keyboard access and narrow-screen controls are checked. |
| P0 | Protect the synthetic demonstration boundary. | Import is synthetic-only, previewed and committed atomically; invalid input changes no state. Session/origin checks and request/state bounds are enforced. |
| P1 | Give an operator an exception view and safe void action. | Pending work has a traceable reference; safe void has defined release behavior and cannot erase a settled promise. |
| P1 | Display executable evidence. | At least 20 deterministic scenarios expose expected versus actual checks, and deliberately broken behavior turns the evaluator red. |

Acceptance intent is not a result. The current executed results, denominators and runtime limitations belong in [test results](test-results.md).

## Important interaction decisions

1. I label availability as a snapshot and show the hold timer in the same flow as the choice it protects.
2. I present a changed time or price as an alternative requiring acceptance. I never silently exchange a component.
3. I keep “validate”, “submit” and “settle” separate so the guest sees what the proof has and has not established.
4. I send an uncertain response to receipt recovery before allowing a second submission.
5. I make the owner of a payment exception visible instead of implying the guest must troubleshoot a settlement system.
6. I allow safe release or void only where the state rules permit it. Every button must map to one defined transition.

## Release gates

For a reviewable local proof I require the deterministic scenario suite, broken-rule control, runtime concurrency/persistence/isolation checks and a full guest recovery walkthrough. Evidence is limited to the environment and cases actually executed. Before a real venue pilot I additionally require an approved live data/payment boundary, source-of-truth ownership, identity and role controls, operational monitoring, an agreed reconciliation process, accessibility review and a measured baseline. Before a public deployment I require an owner-approved destination and scoped authorization.

My decision rationale is in [decision memo](decision-memo.md), research in [discovery plan](discovery-plan.md), workflow in [journeys and states](journeys-and-state.md), measurement in [metrics and experiments](metrics-and-experiments.md), and delivery sequencing in [priorities and roadmap](priorities-pilot-roadmap.md).
