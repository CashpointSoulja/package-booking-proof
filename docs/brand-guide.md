# Brand guide — Package booking proof

Ayo Ahmed — Independent concept · 13 October 2026

## Ownership and disclosure

I am building an **unofficial, independent concept for Trybe**, using public material to understand the commercial setting. Ayo Ahmed is the dominant author identity. Trybe is secondary context, not the product owner or an endorsement. The owner selected Trybe after a hidden-employer FRESH posting; I have not verified that Trybe is hiring for that role and make no agency attribution or employment claim.

The interface must prominently say **Unofficial**, **Independent concept for Trybe**, and **All guests, inventory, orders and payments are synthetic. Not connected to Trybe.** Every outcome, price, capacity and metric in the demonstration belongs to the simulation. This concept is not a vendor API contract or a claim about production Trybe behavior.

## Source research and inspection method

I read the official sources below on **2026-10-13**. Homepage, About, Dynamic Packages, Waitlists, US homepage and the canonical investment article were also rendered at **1440 × 1000** in Chromium and inspected as actual pixels and computed CSS before choosing the concept direction.

This was a **fetched-original render**, with important limits: normal HTTPS requests through the configured proxy fetched the official HTML, CSS, scripts and same-domain images with TLS verification enabled. Chromium rendered those original responses through request interception. Live browser navigation failed with `ERR_CERT_AUTHORITY_INVALID`; the existing operating-system proxy CA was not in the browser's trust store. A request to persist that CA in the browser store was automatically rejected as a trust change, so browser trust was not modified and verification was not disabled. Nonofficial hosts and every font request were blocked. Proprietary fonts were never downloaded. Computed font-family values are declarations; visible letterforms are fallback fonts, not the licensed fonts. Lazy images below the initial viewport may be absent in the full-page captures. No interaction or pixel identity with the live vendor site is claimed.

Research-only captures and original fetched files are retained outside the repository in `work/brand-research/`. The reproducible inspection script is `render-fetched.cjs`; its `fetched-observations.json` records timestamps, requested files, computed values and request blocks. These source assets are not shipped with this concept.

| Official source | Evidence read or observed | What I take from it |
| --- | --- | --- |
| [Homepage](https://try.be/) | Public positioning covers spa, leisure and activity operations, with guest, front-of-house and back-of-house feature groups. The rendered hero combines a left headline and pink action with a portrait/UI composite; later sections use fine dividers and broad whitespace. | Booking is an operational coordination problem as well as a guest purchase. Use a calm, understandable workflow. Do not reuse the marketing statistics or imply they measure this concept. |
| [About](https://try.be/about) | The page states that Trybe supports over 400 properties across **33 countries**. It describes online availability and reduced manual reservation work. Rendered pixels show editorial copy beside team photographs and a roomy team grid. | Treat scale as a vendor marketing claim, not an independently audited figure or evidence of our results. Keep discovery hypotheses separate from evidence. |
| [Dynamic Packages](https://try.be/dynamic-packages) | Each component draws on its own availability, while elements are booked together; the page describes guest timing choices and overlap prevention. The rendered page alternates text and software illustrations beneath a spacious hero. | Focus on one treatment plus shared-area session, and make the whole-package outcome visible. This concept's atomic hold, revision and receipt rules are my implementation decisions. |
| [Waitlists](https://try.be/waitlists) | Treatment waitlists can be managed by an operator; class waitlists can promote a guest automatically when capacity opens. Rendered sections alternate explanatory copy with form/table illustrations. | A failed reservation must have a named recovery owner. This concept does not implement Trybe's waitlist machinery or send messages. |
| [US homepage](https://try.be/us) | Official text uses the same operations proposition with US localization. The fetched render shares the cream hero, portrait/UI composition and pink actions. | Multi-market context motivates explicit currency and site boundaries. Do not infer customer geography from the synthetic tenant or claim localized production parity. |
| [Series A announcement](https://try.be/blog/trybe-five-elms-capital) | January 2026 article announces a **$30 million USD Series A** from Five Elms Capital, describing geographic expansion, payments and product investment. Its rendered article has a serif title, pink curved gradient beneath the hero, a narrow prose column and plum sidebar. | Commercial context supports studying package friction and payment-state clarity; it does not prove a specific vacancy, roadmap commitment to this concept or product impact. |
| [Terms](https://try.be/terms/) | Official PDF, clause 9.1, retains supplier ownership of software and documentation IP; clause 6.4 does not imply further confidential-information licenses. | Public access is not a permission to redistribute protected brand assets or vendor software. |

The supplied long investment URL, `https://try.be/blog/trybe-announces-30m-series-a-investment-from-five-elms-capital/`, returned **404** in a normal HTTPS fetch. I found and read the canonical official URL shown above; I do not treat the missing page as evidence.

## Computed visual evidence

The following values came from fetched official CSS computed by Chromium. They describe the source, not mandatory tokens for the independent implementation.

| Element | Computed observation |
| --- | --- |
| Marketing body | Declared `Instrument Sans` followed by system sans-serif; 16px; foreground `rgb(87, 83, 78)` / `#57534e`; background `rgb(255, 250, 248)` / `#fffaf8`. |
| Marketing headings | Declared `ABC Arizona Serif`, then `Martina Plantijn`, `GT Alpina`, serif fallbacks. Homepage H1: 60px, regular, 60px line height, `#171717`; Packages/Waitlists H1: 50px; About/investment H1: 48px. |
| Lead copy | Homepage and feature heroes use 18px sans-serif; source homepage lead foreground `#525252`. |
| Brand accents present in the rendered DOM | Plum `rgb(73, 24, 73)` / `#491849`; vivid pink `rgb(255, 0, 102)` / `#ff0066`; white surfaces and neutral fine rules. |
| Homepage H1 geometry | At 1440px viewport: x=96px, y=222px, width=512px, height=120px, in the fallback render. This is evidence of source spacing, not a copied layout specification. |

My pixel inspection found a consistent cream canvas, large editorial serif headings, compact pink pill actions, soft pink hero gradients, plenty of separation between sections, and restrained interface illustrations. Photographs, logos, customer lists, testimonial cards and source UI screenshots belong to the source site and will not appear in this concept.

## Original implementation direction

I choose an original editorial workspace: a plain Ayo Ahmed nameplate, a prominent unofficial notice, a concise package story, and task-focused cards for availability, hold, validation, submission and simulated settlement. The current state and next safe action matter more than decorative marketing sections. A summary sits beside the workflow on desktop and becomes a normal stacked section on narrow screens. Recovery stays next to the failed step, with an explicit time/price alternative and a clear exception handoff.

Use **Georgia** for headings and **Instrument Sans** for body and controls. Georgia is a system fallback, not a recreation of ABC Arizona Serif. Instrument Sans is an openly licensed font; ship its license alongside the locally hosted asset. The source file is available from the [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/instrumentsans), which contains `OFL.txt`. Do not fetch or bundle Arizona, Martina Plantijn or GT Alpina files. A missing body font must leave a readable system-sans fallback.

The concept palette can use original cream `#fff8f3`, deep plum `#3e183c`, and rose `#e73379`, with white card surfaces, dark text, and quiet beige rules. They are an independent interpretation of the observed palette, not asserted official Trybe tokens. Pink should be an accent or appropriately contrasted action surface. Confirm actual text contrast in the built UI; never rely on color alone for state. Use explicit labels and icons for expiry, conflicts, validation and settlement.

Suggested scale: generous 32–60px serif display typography where space allows; 16–18px readable body copy; 12–14px supporting labels only; 16–24px card gaps; 44px or greater comfortable recovery controls. At 320, 390 and 540px, titles should wrap, cards should stack and buttons should remain within their container. Keyboard focus must be visible. Status changes should be announced without stealing focus or removing the recovery control.

The approved visual relationship is limited to broad, unowned ideas: cream, plum and rose; serif/sans hierarchy; careful spacing. Create original page composition, components, illustrations and copy. There is no copied Trybe mark, wordmark styling, photograph, screen, media file or testimonial, and no animation that reproduces the source site.

## Brand-source exception and publication boundary

I document a specific exception to literal brand matching: **no publishing license has been established for Trybe's protected assets or proprietary fonts**, so I will not attempt exact brand reproduction. The official terms are a software access agreement rather than a general website-media license; they retain rights and provide no basis here to infer a public publication license. This is a conservative asset boundary, not legal advice or a finding that referencing the company name is prohibited.

The only Trybe use is plain-text identification of the research subject plus official source links, with the independent/unofficial/synthetic disclosure. Ayo Ahmed owns the concept narrative and is the only public author attribution. Source captures remain research evidence outside the deliverable. Public deployment and an actual-public-HTTPS recording still require an owner-approved destination and scoped authorization; no deployment permission or credential is implied by reading these sources.

## Product-domain evidence boundary

I also read the official [availability guide](https://docs.try.be/guides/availability-and-booking), [basket/checkout guide](https://docs.try.be/guides/basket-and-checkout), [OfferingAvailability reference](https://docs.try.be/endpoints/OfferingAvailability), and [Sessions reference](https://docs.try.be/endpoints/Sessions) on 2026-10-13.

The availability guide describes ephemeral slot snapshots and offering type plus ID identity. It explains practitioner/room constraints, slot price rules and a reservation conflict when another booking wins. The checkout guide recommends pre-submit validation, authoritative basket totals, expiry-aware item holds, and distinguishes submitted orders from settled payment events before fulfillment. The references expose offering-day availability overrides and session capacity, remaining capacity, site, room and minor-unit price fields. These are research inputs only; no live API request, vendor integration, token, personal guest record or payment was used. The simulation implements its own explicit contract and must label its guarantees accordingly.
