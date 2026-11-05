# Plans — Galamed motion improvements

Plans are self-contained execution briefs written by `improve-animations`.
Each plan names its commit stamp; if the code has drifted since, the executor
must stop rather than improvise.

## Plan index

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Animate the homepage FAQ accordion open/close](001-faq-accordion.md) | MEDIUM | DONE |
| 002 | [Bridge the product filter/search re-entrance](002-product-filter-bridge.md) | MEDIUM | DONE |

## Recommended execution order

1. **001** — FAQ accordion. No dependencies; the `--ease-ui` token it adds to
   `src/styles/global.css` is intended to be reused by later plans in this
   series (product-filter bridge, mobile menu, press feedback), so run it
   first.

## Notes

- Queue (from the find-animation-opportunities sweep): ① FAQ accordion —
  **done (001)**, ② product filter/search entrance bridge — **planned (002)**,
  ③ mobile menu entrance (`Navbar.astro:56`), ④ standardized `:active` press
  feedback across CTAs, ⑤ quote-form submit feedback, ⑥ WhatsApp float
  entrance.
- All plans in this series are CSS-first; no motion library is wanted.
- `prefers-reduced-motion` is deliberately handled once, globally, in
  `src/styles/global.css:79-89` — never add per-feature media queries.
