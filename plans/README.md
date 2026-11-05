# Plans — Galamed motion improvements

Plans are self-contained execution briefs written by `improve-animations`.
Each plan names its commit stamp; if the code has drifted since, the executor
must stop rather than improvise.

## Plan index

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Animate the homepage FAQ accordion open/close](001-faq-accordion.md) | MEDIUM | DONE |
| 002 | [Bridge the product filter/search re-entrance](002-product-filter-bridge.md) | MEDIUM | DONE |
| 003 | [Slide-fade the mobile menu in from the navbar](003-mobile-menu-entrance.md) | MEDIUM | DONE |
| 004 | [Harden the mobile menu entrance (JS-sequenced)](004-mobile-menu-hardening.md) | MEDIUM | DONE — fixes 003's entrance gap |
| 005 | [Standardize `:active` press feedback on button-shaped controls](005-active-press-feedback.md) | MEDIUM | DONE |

## Recommended execution order

1. **001** — FAQ accordion. DONE.
2. **002** — product filter/search bridge. DONE. Depends on 001's `--ease-ui`
   token.
3. **003** — mobile menu entrance. DONE, superseded by 004.
4. **004** — mobile menu hardening. DONE.
5. **005** — press feedback standardization. Independent of 001–004; pure
   class-attribute edits, no tokens, no JS.
4. Remaining queue (④ standardized `:active` press feedback, ⑤ quote-form
   submit feedback, ⑥ WhatsApp float entrance) are independent of 001–003
   except for the shared token.

## Notes

- Queue (from the find-animation-opportunities sweep): ① FAQ accordion —
  **done (001)**, ② product filter/search entrance bridge — **done (002)**,
  ③ mobile menu entrance — **done (003, hardened by 004)**, ④ standardized
  `:active` press feedback across CTAs — **done (005)**, ⑤ quote-form
  submit feedback, ⑥ WhatsApp float entrance (motion side; 005 already gives
  the float its press state). Proposed follow-up: rewrite plan 001's two
  `content-visibility … allow-discrete` shorthand entries to the longhand
  pattern per the shorthand-parsing risk found auditing 004.
- All plans in this series are CSS-first; no motion library is wanted.
- `prefers-reduced-motion` is deliberately handled once, globally, in
  `src/styles/global.css:79-89` — never add per-feature media queries.
