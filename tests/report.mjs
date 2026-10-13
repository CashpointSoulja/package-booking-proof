import { readFileSync, writeFileSync } from 'node:fs';

const domain = JSON.parse(readFileSync('work/test-results/domain.json', 'utf8'));
const runtime = JSON.parse(readFileSync('work/test-results/runtime.json', 'utf8'));
const security = JSON.parse(readFileSync('work/test-results/security.json', 'utf8'));
const escape = value => String(typeof value === 'string' ? value : JSON.stringify(value)).replaceAll('|', '\\|').replaceAll('\n', ' ');
const rows = domain.result.cases.flatMap(s => s.assertions.map(a => `| ${s.id} ${escape(s.name)} | ${escape(a.label)} | ${escape(a.expected)} | ${escape(a.actual)} | ${a.passed ? 'PASS' : 'FAIL'} |`));
const assertionRows = result => result.assertions.map(a => `| ${escape(a.label)} | ${escape(a.expected)} | ${escape(a.actual)} | ${a.passed ? 'PASS' : 'FAIL'} |`).join('\n');
const text = `# Executed integrity evidence

Ayo Ahmed - Independent concept. All fixtures, guests, inventory, orders and settlement events are synthetic. This is an unofficial concept and is not connected to Trybe.

Generated from actual assertion artifacts on ${new Date().toISOString()}. Every domain case starts from a new fixed-clock fixture; expiry advances simulation time without sleeping. The passing tests assert behavior, authoritative rejection reasons and invariant preservation. They do not claim commercial performance or causal uplift.

## Domain assertions shared with the UI

Executed command: \`npm run test:domain\`. The UI calls \`GET /api/eval\`; the real Worker imports \`src/eval.js\`, which dispatches through the same production \`src/domain.js\` used for booking actions. The UI renders each executed expected/actual assertion and scenario total.

**${domain.result.passed}/${domain.result.total} scenarios passed, ${domain.result.assertions} visible expected/actual assertions; ${domain.result.failed} failed scenarios.**

Mutation control: the same evaluator with the actual domain \`skipExpiry\` fault injection produced **${domain.mutationControl.failed} failed scenarios** (${domain.mutationControl.failedCases.join(', ')}). The normal suite requires that control to turn red. \`GET /api/eval?broken=1\` demonstrates the failure only in isolated evaluator fixtures; \`POST /api/action\` rejects attempts to pass \`skipExpiry\` to a visitor's booking.

| Scenario | Assertion | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Actual Worker HTTP and SQLite Durable Object evidence

Executed command: \`node --test tests/runtime.test.mjs\` with loopback network permission. Runtime under test: **${escape(runtime.runtime)}**. **${runtime.assertions.length}/${runtime.assertions.length} assertions passed.** The suite sends actual HTTP requests through workerd, concurrently reserves the final slot and restarts the process against the same on-disk SQLite persistence root. It uses the declared Worker entrypoint, ES modules, assets binding and \`BookingSession\` with SQLite storage. HTTP requests explicitly use \`Connection: close\` and consume their responses; the harness does not retry failed requests or mutations.

| Assertion | Expected | Actual | Result |
| --- | --- | --- | --- |
${assertionRows(runtime)}

## Deterministic security-clock evidence

Executed command: \`node --test tests/http.test.mjs\`. The shared HTTP guard accepts an explicit clock in these unit tests. They exhaust 2,000 lifetime requests across simulated minute windows and expire a visitor at exactly 24 hours; no real-time sleeps or expiry waits are used. **${security.assertions.length}/${security.assertions.length} assertions passed.**

| Assertion | Expected | Actual | Result |
| --- | --- | --- | --- |
${assertionRows(security)}

## Transport finding

An earlier full-suite run stopped with Undici \`UND_ERR_SOCKET: other side closed\` on a pooled connection immediately after the hostile-Origin POST had returned 403. The following missing-Origin assertion had not executed, and the runtime artifact was absent, so that run was not reported as passing. The harness now explicitly closes each HTTP connection and consumes the asset body instead of reusing a connection that an early unread-body rejection may close. No application guard was changed and no request was retried. The complete suite was then executed twice successfully. This evidence covers that explicit transport; it does not claim keep-alive transport behavior has been validated.

## Scope and limitations

This evidence proves the local Cloudflare workerd/SQLite Durable Object implementation and its tested guards. It does not prove a publicly deployed account's configuration, HTTPS cookie behavior in a live browser, vendor compatibility, production scale, real payment processing or real guest outcomes. No public deployment, live vendor API or outbound messaging was used. A public destination and scoped deployment authorization are absent.

Per-session quotas survive domain reset and runtime restart. Creating a new visitor cookie remains outside a global/IP budget, so these bounds do not prevent an attacker creating many new Durable Objects; that remains a candid aggregate abuse and operating-cost risk documented in the recovery architecture. The current public deployment gates are an owner-approved destination and scoped Cloudflare authorization. A visitor's competitors share that visitor's synthetic inventory; independent visitors intentionally own separate synthetic venues.

Pixel widths and browser workflow evidence are recorded separately under \`docs/pixel-proof/\`. Reproduce the integrity evidence with \`npm ci\`, \`npm test\`, then \`node tests/report.mjs\`. The managed environment requires its supported loopback/network permission when starting workerd; this is an environment constraint, not an application guard bypass.
`;
writeFileSync('docs/test-results.md', text);
console.log(`Wrote docs/test-results.md from ${domain.result.total} executed scenarios, ${runtime.assertions.length} HTTP/runtime assertions and ${security.assertions.length} security-clock assertions.`);
