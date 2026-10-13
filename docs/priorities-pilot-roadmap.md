# My priorities, pilot and 12–18 month decision roadmap

**Ayo Ahmed — Independent concept for Trybe. Unofficial; synthetic only.**

This is a conditional delivery plan, not a committed Trybe roadmap. I would move through evidence gates rather than promise dates for integrations I have not inspected. Month ranges begin only after a partner has agreed scope, authority and access.

## Impact versus effort

I use ordinal judgments until research provides volumes and costs. “High impact” below means high relevance to this package promise, not measured financial return.

| Work | Expected impact | Effort/uncertainty | Priority and rationale |
| --- | --- | --- | --- |
| Atomic reservation, expiry and resource identity | High integrity impact | Medium in proof; high integration uncertainty | P0: the package promise depends on it. |
| Latest validation and explicit change acceptance | High integrity/comprehension impact | Medium | P0: avoids silently changing what the guest selected. |
| Idempotent submit and unknown-result recovery | High duplicate-prevention impact | Medium | P0: lost responses are normal operational failure modes. |
| Settlement/fulfillment separation | High integrity impact | Medium; real provider contract unknown | P0: submission alone is insufficient evidence of payment. |
| Accessible recovery and owned exception handoff | High potential rework impact | Medium; ownership unvalidated | P0/P1: someone must finish the failed workflow. |
| Real analytics and baseline | High decision quality | Medium | Before pilot: I cannot responsibly claim benefit without denominators. |
| Catalogue breadth and package builder | Unproven | High | Defer until repeated demand and the core flow are reliable. |
| Personalisation and promotions | Unproven | Medium/high | Defer; they add policy complexity before the promise is proven. |

## Pilot design and adoption

I would start at one consenting venue with one stable two-part package, a named front-desk owner, an inventory owner and a settlement/reconciliation owner. I would choose a bounded trading window with enough eligible attempts to learn, supported operator coverage and a documented fallback. I would not start with every package, peak season or multiple unverified inventory sources.

Before opening the pilot, I would complete a baseline, inspect the source contract, rehearse conflict/expiry/lost-response/failed-payment cases and verify rollback. Staff would receive a short state card explaining hold, validated, submitted, settled, exception and void; training would use synthetic records. The guest flow would clearly identify the selling venue, terms, support route and what is guaranteed. These production responsibilities are not supplied by this concept.

During the pilot I would review exception and capacity reports daily, hold a weekly operator review, and keep the ability to stop new package attempts while resolving existing orders. I would track training completion, correct operator state interpretation and adoption by eligible attempts. A low adoption rate could mean poor placement, lack of package demand, staff resistance or unnecessary workflow; I would investigate before adding features.

## Conditional roadmap

| Period | Intended work | Exit evidence |
| --- | --- | --- |
| Months 0–2 | Discovery, process mapping, baseline, integration feasibility and proof review. | Repeated consequential pain; agreed resource/settlement authority; named owners; accessible tasks understood. |
| Months 2–4 | Harden one package integration, monitoring, roles, reconciliation, expiry policy and rollback rehearsal. | Concurrency/integrity checks pass against integration; all exception classes have an owner; production review approves boundary. |
| Months 4–6 | Bounded single-venue pilot and weekly adoption/recovery iteration. | No confirmed integrity breaches; complete denominators; workload and capacity within agreed guardrails. |
| Months 6–9 | Extend to a second similar venue or package only if the first passes. | Benefits repeat without manual work scaling linearly; differences in calendars/policies explicitly handled. |
| Months 9–12 | Improve hold policy and instrumentation; consolidate common allocation contracts. | Measured improvement with uncertainty reported; support burden sustainable; no accessibility regression. |
| Months 12–18 | Keep a focused product, rebuild an unsuitable authority boundary, or retire the slice. | Decision against the measurable triggers below; broader catalogue only when evidence supports it. |

## Keep, rebuild or retire

These are proposed decision thresholds to agree with a partner before a pilot; they are not observed outcomes or industry benchmarks.

| Decision | Measurable trigger I would propose | Action |
| --- | --- | --- |
| Pause immediately | Any confirmed over-allocation, partial commitment, wrong-site allocation or fulfillment before settlement. | Stop new package attempts, preserve references, reconcile affected records and investigate before reopening. |
| Keep the focused slice | Zero confirmed integrity breaches across two consecutive representative pilot cycles; ≥95% telemetry completeness; operator exception rate and repair time improve against agreed baseline; abandoned holds block no more than 5% of peak sellable scarce-resource minutes. | Continue one-package rollout, with uncertainty and confounders reported. |
| Rebuild the integration boundary | More than 1% of eligible attempts need manual inventory/payment reconciliation in two consecutive review windows, or upstream revisions cannot reliably distinguish stale evidence. | Stop expansion; redesign authority, reconciliation or request-to-book semantics. |
| Revise adoption/flow | Fewer than 60% of eligible package attempts use the new flow after four supported weeks, or fewer than 80% of trained operators correctly classify lifecycle states in a check. | Investigate placement, demand, training and comprehension; retest before expanding. |
| Retire or narrow | After two documented iterations, no meaningful reduction in incomplete commitments/repair effort and ongoing cost exceeds measured benefit over two representative cycles. | End new use of the slice, resolve retained orders and publish the learning. |

Percentages with very small denominators are unstable. I would display the raw counts and require enough eligible attempts to support the agreed decision; low-volume periods can extend a review window, not justify claiming success. A keep decision is a bounded operational decision, not proof of causal commercial uplift.
