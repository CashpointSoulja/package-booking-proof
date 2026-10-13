# My measurement and experiment plan

**Ayo Ahmed — Independent concept for Trybe. Unofficial; synthetic only.**

I have no live baseline, revenue data, interview results or causal uplift. Executed synthetic results belong in [test results](test-results.md); they describe a fixed environment and chosen cases. They cannot tell me how guests will behave or how much a venue will earn.

## Metric definitions before I collect data

| Metric | Numerator / denominator | Window and exclusions | Why I need it |
| --- | --- | --- | --- |
| Complete package success | Settled orders with every required component / eligible package booking attempts | Daily and full pilot; exclude clearly labelled training traffic, retain retries under one attempt ID. | Does the guest obtain the complete intended visit? |
| Integrity breach rate | Attempts with over-allocation, partial commitment, wrong-site allocation or premature fulfillment / eligible attempts | Daily; any confirmed breach is a stop event. | Reliability gate; a conversion gain cannot excuse a broken promise. |
| Forced-change rate | Attempts requiring a capacity/time/price change after initial choice / eligible attempts | Daily, segmented by reason and component. | Where snapshots become stale or supply changes. |
| Recovery completion | Recoverable failures followed by settled complete package / failures with an offered supported recovery | Same session plus defined 24-hour follow-up where lawful. | Whether recovery actually helps. |
| Operator exception rate | Distinct exceptions requiring human action / submitted package orders | Daily; de-duplicate by order and reason. | Operational burden per order. |
| Operator repair time | Total active minutes spent on tracked exceptions / resolved tracked exceptions | Weekly; report median and p90 as well as totals. | The cost of failures and handoffs. |
| Hold utilisation cost | Scarce-resource minutes blocked by expired/abandoned holds / total sellable scarce-resource minutes | Peak and off-peak separately. | Whether the protection harms capacity use. |
| Unknown-result resolution | Lost-response attempts resolved by receipt lookup / lost-response attempts detected | Daily with a bounded resolution-time distribution. | Safe retries and guest confidence. |
| Task comprehension | Participants correctly explaining reserved, submitted and settled status / participants shown that state | Per research round; report raw counts and task wording. | Whether the visible model matches the domain model. |
| Booking duration | Time from eligible attempt start to complete submission or abandonment | Median/p90, by device and assistance use; retain censoring rules. | Friction and hold policy. |

An “attempt” needs one stable identifier spanning quote refreshes and retries. A page view or repeated button press is not an attempt. I would define eligibility and abandonment timeout before analysis, and report excluded traffic separately. Business revenue would require realised service revenue and cancellations/refunds, not the value of submitted synthetic orders.

## Instrumentation I would add for a pilot

I would record transitions such as attempt started, quote shown, hold created/conflicted/expired/released, validation passed/failed, change offered/accepted, submit acknowledged, receipt recovered, settlement confirmed/failed, exception opened/resolved and fulfillment allowed. Each needs an attempt/order correlation ID, authoritative timestamp, state revision, reason code and deployment version. I would minimise identifying data and avoid putting names or payment information in events.

The current proof's bounded synthetic audit is for debugging rules; it is not a production analytics warehouse. Visitor-isolated demonstrations do not share a venue denominator. I would design a deduplicated server event pipeline, retention policy and reconciliation check before claiming pilot metrics.

## Proposed experiments, in order

| Stage | Hypothesis | Method | Primary measure | Guardrail and decision |
| --- | --- | --- | --- | --- |
| Comprehension | Guests can distinguish a hold, submitted order and settled booking. | Moderated synthetic tasks with eight to twelve recruited participants; report counts per state. | Correct state explanation without prompting. | Any recurring mistaken belief that payment is complete requires content/flow revision. |
| Recovery usability | Guests can recover conflict, expiry and unknown result without creating a duplicate. | Counterbalanced synthetic tasks; count independent recovery, help and abandonment. | Completed recoveries / exposed recoverable tasks. | No duplicate commitment; repeated wrong next actions require redesign. |
| Operational pilot | Coordinated allocation reduces incomplete package commitments and repair burden. | Two-cycle baseline then a bounded venue-approved cohort; matched comparison or safe randomisation if feasible. | Integrity and exceptions per eligible attempt, plus repair minutes. | Stop on a confirmed integrity breach; investigate worsened peak-capacity blocking. |
| Hold policy | A revised hold duration improves completion without materially increasing abandoned capacity. | One policy variable, preregistered assignment and analysis after pilot safety. | Complete-package success and hold utilisation cost together. | No forced accessibility disadvantage; pause on capacity loss beyond agreed threshold. |

The experiments are proposed. No participants have been recruited, no traffic assigned and no live experiment has run.

## Statistical and business honesty

I would collect two representative trading cycles to establish a baseline, then use observed rates and a venue-agreed minimum worthwhile effect to calculate sample size. I will not invent a powered sample or promised uplift now. Small pilot proportions will be reported as counts with uncertainty, segmented cautiously. Historical comparison may reflect demand, seasonality, staffing or pricing changes and cannot establish causation alone.

Before a rollout decision I would agree the cost of integration and operation, expected avoided repair minutes, capacity opportunity cost and the break-even volume. A simple benefit model is: avoided exceptions × measured repair minutes × approved labour cost, plus measured retained complete visits, minus integration/operating cost and lost capacity. Every input is currently missing; a synthetic order total is not a substitute.

## Evidence reporting template

For every observation I would publish: environment/cohort, date range, numerator, denominator, exclusion count, missing data, baseline, uncertainty and whether the claim is descriptive or causal. For example, “7 of 10 recruited participants completed the synthetic expiry task without assistance” is an illustrative reporting format, **not an observed result**. The same discipline applies to deterministic checks: assertion count and scenario count are different denominators.
