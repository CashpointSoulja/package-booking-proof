# My decision: protect the package promise first

**Ayo Ahmed — Independent concept for Trybe. Unofficial; synthetic only.**

I chose an atomic, expiring package hold with explicit revalidation because a guest intends to buy one complete experience. A fast checkout that cannot deliver one component creates work for the guest and venue. I would accept a small amount of visible friction to make that promise precise, while measuring whether the friction and capacity held temporarily outweigh the avoided failures.

## The tradeoff I made

| Option | Benefit | Cost and risk | My judgment |
| --- | --- | --- | --- |
| Book each component separately | Simpler first integration; each resource can use its own flow. | Partial success needs cancellation or operator repair; guest can pay for an incomplete visit. | Useful for independent purchases; unsuitable for this indivisible package promise. |
| Reserve every component without expiry | Protects the selected combination. | Abandoned baskets can lock scarce inventory indefinitely. | Reject for this slice. |
| Atomically hold every component, expire the hold, validate before submit | Makes ownership and recovery legible; returns abandoned capacity. | Adds a timer, revalidation and explicit change acceptance; depends on an authoritative allocator. | My choice for the proof. |
| Optimistically submit and reconcile later | Fewer steps before submission. | Pushes booking failures downstream; requires strong repair, refund and communication operations. | Consider only if research and measured failure rates justify the operational cost. |

Atomicity reduces one class of broken promise; it does not establish that the inventory feed is truthful, that a practitioner is qualified, or that a physical service can run. The proof uses one authoritative state machine per synthetic visitor. A production venue would need a shared, authoritative venue allocator and explicit integration ownership.

## Friction versus utilisation

An expiring hold trades some available inventory for time to decide. A longer hold may help guests who need more time, while causing more abandonment-related blocking. A shorter hold may improve release speed, while forcing more guests to restart. I would measure both sides rather than call a shorter flow an improvement by assumption.

I would start with a configurable, venue-approved hold policy and no countdown experiment during the integrity pilot. Once integrity and recovery are reliable, I would test a single duration change against a predeclared completion and blocked-capacity guardrail. I would segment by package complexity, device and accessibility needs and keep a supported way to request assistance. I would not use an alarming countdown to pressure payment.

## How I would validate pain and benefit

I would ask operators to walk through recent anonymised package failures, then trace each component from enquiry to fulfillment. I would distinguish a guest choosing a different visit from a guest being forced to change because the system promised unavailable capacity. I would observe whether rework comes from allocation, data freshness, payment, staffing or policy. That distinction matters because an atomic hold only addresses some of those causes.

I would measure a baseline over at least two representative trading cycles before a bounded pilot. My primary benefit hypothesis is fewer incomplete package commitments and less operator rework per attempted package booking. Completion rate is a secondary outcome until reliability is established. I would compare matched traffic or use a randomized venue-approved experiment only when control traffic is safe; I would not create an intentionally broken booking path to prove the feature helps.

The proof's deterministic cases demonstrate rules, not demand or ROI. Synthetic task timings could help find awkward screens, but cannot establish commercial conversion, labour savings or causal uplift.

## What would change my mind

- If failures mostly originate in inaccurate external inventory or staffing data, I would prioritise reconciliation and source ownership before expanding the checkout.
- If guests rarely need coupled components and operators resolve exceptions cheaply, I would simplify the product instead of generalising the hold engine.
- If holds consume enough peak capacity to reduce completed visits, I would adjust hold policy, defer holding scarce resources or retire the approach for that package type.
- If the upstream vendor cannot support an authoritative allocation/validation boundary, I would narrow the promise and design a request-to-book flow with explicit confirmation ownership.

## Decisions I deliberately deferred

I deferred real payments, cancellation/refund policy, taxation, vendor-specific endpoint compatibility, customer identity, staffing qualifications and multi-venue distributed coordination. Those decisions require partner evidence and operational policy that I do not have. The [roadmap](priorities-pilot-roadmap.md) treats them as gated discovery and integration work, not committed delivery dates.
