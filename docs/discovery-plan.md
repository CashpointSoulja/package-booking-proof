# How I would discover whether this problem deserves investment

**Ayo Ahmed — Independent concept for Trybe. Unofficial; synthetic only.**

I have not conducted customer interviews or observed live Trybe bookings. This document is my research plan and hypothesis register. Public product material establishes context; it does not establish the pain, frequency or willingness to adopt this concept.

## My initial five whys

This is a tentative causal chain to test, not a root cause found in research.

1. **Why might a guest be disappointed?** One component of the package may become unavailable after the guest chooses it.
2. **Why might that happen?** The guest may have seen separate snapshots while other bookings changed capacity.
3. **Why might separate snapshots become a promise?** The flow may not have one authoritative hold across all required resources.
4. **Why might the problem reach the operator?** Submission, settlement and fulfillment states may be unclear or reconciled late.
5. **Why might it remain costly?** The venue may lack a traceable owner and a standard recovery path for the failed package.

I would stop the chain at whichever assumption evidence disproves. A stale staff rota, incorrect session capacity or cancellation policy could be the actual cause, and would require a different intervention.

## Questions I would answer before a pilot

| Question | Evidence I would seek | Decision it informs |
| --- | --- | --- |
| How often are packages genuinely indivisible? | Product catalogue and recent booking examples, with personal data removed. | Whether a coupled allocation flow is needed. |
| Which component fails and at what stage? | Anonymised incident timelines and booking state transitions. | Hold, validation, feed freshness or settlement priority. |
| Who currently repairs a partial booking? | Operator walkthrough of a recent case and documented escalation route. | Exception owner, queue and permissions. |
| What does “available” actually mean? | Capacity rules, staffing/qualification policy, calendar ownership and latency. | Authoritative inventory contract. |
| What happens when the response is lost? | Current retry/reconciliation examples and receipt semantics. | Idempotency and lookup boundary. |
| How long do guests need to complete checkout? | Baseline duration distribution and observed accessibility needs. | Hold policy and support path. |
| How costly is a held but abandoned slot? | Peak/off-peak occupancy and hold-release logs. | Utilisation guardrails. |
| What is acceptable recovery? | Guest comprehension tasks and operator policy review. | Explicit alternatives, refund/void policy and wording. |

## A bounded research sequence

I would begin with permissioned research at one venue selling the selected package type. My proposed starting sample is five to eight operators across front desk, treatment operations and management, plus eight to twelve consenting adult guests or representative participants for task-based usability. These are recruitment targets, not completed interviews or statistically representative samples.

First I would map current operations with two recent successful and two recent failed or changed package examples per operator where available. I would request anonymised process artifacts, not guest records. Then I would run guest tasks using synthetic data: selecting a complete package, losing final capacity, accepting a changed quote, recovering an unknown result and understanding payment failure. I would ask participants to explain what they believe is reserved and paid at each stage. Finally I would review the findings with the people responsible for inventory and settlement.

I would record consent, participant role, scenario, observed behaviour, exact participant words where permission permits, and my interpretation separately. I would retain only the agreed minimum and remove identifiers from the synthesis. A usability participant's preference is not evidence of increased conversion.

## My assumptions register

| Assumption | Current confidence | Smallest useful validation | Response if false |
| --- | --- | --- | --- |
| The guest wants the two components as one visit. | Low; product hypothesis. | Catalogue and guest task evidence. | Offer independent purchases or request-to-book. |
| A hold can be authoritative across room, practitioner and shared area. | Proven only within synthetic state. | Integration contract and adversarial concurrency check. | Reduce promise or rebuild allocation boundary. |
| An explicit changed-time/price step is understandable. | Unvalidated with people. | Comprehension task and completion errors. | Revise content and interaction before rollout. |
| Operators can own settlement exceptions. | Unvalidated. | Responsibility mapping and queue walkthrough. | Establish owner/escalation before pilot. |
| Hold expiry provides acceptable decision time. | Unvalidated. | Baseline timing, assistance needs and release cost. | Change policy and recovery support. |
| The integration can distinguish submit from settled. | Demonstrated only in simulation. | Real lifecycle and reconciliation contract. | Gate fulfillment on reliable confirmation or narrow scope. |

## Synthesis and decision

I would publish a research ledger with participant counts, recruitment bias, tasks, observation denominators and disconfirming evidence. I would rank problems by frequency, severity and repair effort, then compare them with the implementation cost. A proceed decision requires a repeated, consequential problem, a feasible authority boundary and named operational ownership. If any is missing, I would continue discovery, change the slice or stop rather than infer demand from the quality of this prototype.
