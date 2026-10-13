# Interface evidence

Author: Ayo Ahmed - Independent concept.

I checked the original interface against the actual local Cloudflare Worker and SQLite Durable Object runtime at `http://127.0.0.1:8787` on 13 October 2026. These are browser screenshots of the running app, not design mockups, vendor assets, or a public recording. A public HTTPS recording remains blocked by the destination and authorization described in `../recording-status.md`.

The `initial`, `conflict`, `exception`, and `evidence` files cover widths **320, 390, 540, and 1440 CSS pixels**. Each has a full-page image and a `crop` viewport image. I scroll to the top before full-page capture so the sticky synthetic disclosure appears at its natural starting position; viewport crops show it during the interaction. No image overlays or alterations were added.

For every width I executed: stale competing reservation; explicit 14:00 / £110 to 16:00 / £120 alternative; later £5 price revision; explicit release, fresh quote and hold at £125; synthetic consent; latest evidence validation; preference edit invalidating validation; revalidation; submission; authoritative receipt recovery; blocked pre-settlement fulfilment; failed simulated settlement; owned exception and synthetic handoff. The complete workflow had no horizontal page overflow or uncaught application/CSP errors. Expected domain rejections return HTTP 409.

The normal evaluation returned **34/34 scenarios, 108 executed assertions, zero failures**. Deliberately broken rules returned **32/34, two failures**, with expected and actual values visible in expanded result rows. The injection operates only on evaluator state.

I also checked keyboard activation of hold, consent and validation; expired hold capacity release followed by fresh quote review and a new hold; fixed synthetic room preview and atomic import commit; and an actual downloadable audit with nine rows and a matching denominator. The unknown-result check committed a reservation at the server, lost the browser response, reloaded, verified submission/reservation remained blocked, then recovered exactly one original booking through its idempotent receipt. `recovery-390.png` records the recovery session.

The UI reports current state counts and occupied listed package opportunities from actual synthetic state, including competing holds, with explicit sample/denominators and the 14:00–18:00 UTC supply window. Allocated capacity is not paid revenue. Baseline unavailable; these observations demonstrate behaviour and make no improvement or causal claim.
