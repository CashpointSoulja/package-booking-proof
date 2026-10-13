# Package Booking Proof

**Ayo Ahmed — Independent concept for Trybe.**

**Unofficial. All guests, inventory, orders and payments are synthetic. Not connected to Trybe.**

I built one small commercial slice: a treatment needing a practitioner and room, followed by a shared-area session. It demonstrates snapshot availability, a coherent expiring hold, explicit changed-choice recovery, validation, submission, simulated settlement and an owned exception. It is an independent synthetic model, not a compatible Trybe API client or a live property-management system.

## Run the actual Worker locally

Node 24 and the locked development dependencies are required:

```sh
npm ci --no-audit --no-fund
npm start
```

Open the local address printed by Wrangler for development. This executes the Cloudflare Worker runtime with a persistent SQLite Durable Object. Development state is kept in ignored `work/dev-state`. Each browser visitor owns a separate synthetic venue; competing reservations inside that visitor share capacity. Refreshing the page preserves the session.

```sh
npm test
npm run evidence
npm run deploy:check
```

The evaluator executes the same domain rules as the server and renders every expected/actual assertion in the UI. The deliberately broken expiry control must produce red results. Read [executed test evidence](docs/test-results.md) and [pixel/workflow evidence](docs/pixel-proof.md) for actual results and limits.

## Public deployment and recording

Public deployment is pending an approved destination and scoped existing authentication. The configuration disables `workers.dev` and preview URLs. There is no configured Cloudflare account/token or owner-approved public destination in this task. The dry-run validates bundling without deploying resources. The exact boundary and reproduction steps are in [deployment readiness](docs/deployment-readiness.md). Deployment requires Ayo's approved account, new Worker name, public URL and scoped existing authentication. Do not reuse or alter an existing deployment.

The requested 105-second vertical video has [capture/composition sources, storyboard and narration](recording/README.md). An actual public-HTTPS capture is pending the approved deployment. Local development screenshots verify the implementation; they are not a substitute recording. Ayo must fully watch and listen to the final public-UI cut before any future outreach. No outreach has been performed.

## Product and engineering decisions

- [Brand guide and official source inspection](docs/brand-guide.md) — the first authored commit; original cream/plum/pink layout, Georgia and openly licensed Instrument Sans, with no copied vendor assets.
- [PRD and short story](docs/prd.md), [my decision memo](docs/decision-memo.md), and [discovery plan](docs/discovery-plan.md).
- [Guest/operator journeys and state diagram](docs/journeys-and-state.md).
- [API grounding and simplified contract](docs/api-grounding.md), [architecture, abuse limits and recovery runbook](docs/architecture-and-recovery.md).
- [Metrics and experiments](docs/metrics-and-experiments.md), [priorities, adoption pilot and 12–18-month roadmap](docs/priorities-pilot-roadmap.md).

There are no interviews, achieved conversion/revenue gains, live guest records, real payment rails, notifications or hiring claims in this proof. Synthetic counts include their sample, denominator and window. Customer pain and commercial benefit still require discovery and a measured baseline.
