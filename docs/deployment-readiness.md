# My deployment boundary and reproduction steps

**Ayo Ahmed — Independent concept for Trybe. Unofficial; synthetic only.**

The source executes locally in the actual Cloudflare workerd runtime, with SQLite Durable Object persistence. The Worker bundle also passes `npm run deploy:check`. These checks do not create a public deployment.

## Exact public-deployment blocker

No owner-approved Cloudflare account, new Worker destination or public HTTPS URL has been supplied. No scoped Cloudflare deployment token or account identity is configured in this environment. Repository authentication does not authorize Cloudflare deployment. I did not attempt login, signup, change a paid plan or reuse any existing deployment.

The committed configuration intentionally has `workers_dev: false` and `preview_urls: false`; it has no routes or account ID. There is no public Demo link. The 105-second public-UI video is therefore also blocked, while its reproducible sources and draft narration are prepared.

## What is reviewable now

```sh
npm ci --no-audit --no-fund
npm test
npm run evidence
npm run deploy:check
npm start
```

The locked versions are Wrangler 4.149.0 and its matching Miniflare 5.20261006.1-alpha. The latter is the published matching runtime dependency; I do not imply a stable production release guarantee from that version label. Tests invoke the actual Worker entry point, SQLite Durable Object and shared rules. The CLI wrapper keeps generated state/config/logs inside ignored `work/`.

Local development UI checks are permitted to use a loopback address. The recording script rejects HTTP, localhost, embedded credentials and unapproved origins; local screenshots are implementation proof, not a substitute public recording.

## Once Ayo approves a destination and scoped existing auth

I would verify the approved account and a genuinely new Worker name without changing existing resources, then fill the approved destination into the configuration. I would enable a new `workers.dev` URL or the explicitly approved route only for that destination. The existing `v1` migration creates `BookingSession` using `new_sqlite_classes`; it contains no deletion or transfer of another resource.

I would confirm the destination can run within the owner's existing free allowance without buying or upgrading anything. The aggregate anonymous-session creation risk is documented in [architecture and recovery](architecture-and-recovery.md); per-session quotas are not an aggregate cost control. A public pilot needs an operating decision about that risk, rather than treating local bounds as complete abuse prevention.

After publishing only the approved new Worker, I would repeat the HTTP, persistence, visitor isolation, origin/token, responsive and keyboard checks against that HTTPS origin, including Secure cookies and actual reload behavior. I would record its exact version and deployment URL. Only then would I run the [public capture workflow](../recording/README.md), inspect the scenes and have Ayo fully watch and listen to the complete final cut.

No deployment, recording completion or full-watch review is claimed. No outreach or application action has occurred. Any future outreach would use only the approved Demo and Video links.
