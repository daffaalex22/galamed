# 008 — Parse-safe the FAQ accordion transitions (double-shorthand)

- **Status**: DONE
- **Commit**: bf258bc
- **Severity**: LOW (insurance; no visual change on supporting browsers)
- **Category**: Cohesion & tokens / Compatibility
- **Estimated scope**: 1 file, one rule pair rewritten in
  `src/styles/global.css`
- **Closes**: the last parked item from plan 001 (flagged while auditing
  plans 003/004)

## Problem

Plan 001's FAQ accordion writes `allow-discrete` — the keyword that makes the
`content-visibility` trick (transitioning a property that normally only
flips on/off) work — **inside the `transition` shorthand**. CSS discards an
entire shorthand declaration if any single piece of it fails to parse. On an
engine that doesn't accept `allow-discrete` in shorthand form, the WHOLE
declaration dies — including the plain `height` and `opacity` transitions —
and the FAQ snaps open instantly instead of animating. Plan 004 already
moved the mobile menu off this risky spelling; the FAQ is the last place
still using it.

**Current code — `src/styles/global.css` (the pair of `.faq-accordion` rules
added by plan 001, currently written as):**

```css
.faq-accordion::details-content {
  height: 0;
  opacity: 0;
  overflow: clip;
  /* Closing (state removed → this rule applies). Shorter than opening. */
  transition:
    height 200ms var(--ease-ui),
    opacity 200ms var(--ease-ui),
    content-visibility 200ms allow-discrete;
}

.faq-accordion[open]::details-content {
  height: auto;
  opacity: 1;
  /* Opening. Reveals get a longer beat than collapses. */
  transition:
    height 250ms var(--ease-ui),
    opacity 250ms var(--ease-ui),
    content-visibility 250ms allow-discrete;
}
```

## Target

MDN's documented cross-browser pattern: **the same `transition` written
twice**. The first declaration omits `allow-discrete` — it parses in every
engine, so `height`/`opacity` transitions survive everywhere. The second
adds the keyword; engines that accept it keep it (and gain the
content-visibility behavior), engines that don't discard that one
declaration *without touching the first*. All-or-nothing now only ever costs
one duplicated declaration, not the feature.

Timing values are unchanged — asymmetric beats preserved (close 200ms, open
250ms), curve `var(--ease-ui)` unchanged.

**Exact end state — replace the entire rule pair above with:**

```css
.faq-accordion::details-content {
  height: 0;
  opacity: 0;
  overflow: clip;
  /* Closing (state removed → this rule applies). Shorter than opening.
     Two shorthands: the first parses everywhere (no exotic keyword); the
     second re-declares with allow-discrete and is discarded WHOLE by
     engines that don't parse the keyword in shorthand — the all-or-nothing
     rule there only costs the duplicate, not the feature. */
  transition:
    height 200ms var(--ease-ui),
    opacity 200ms var(--ease-ui),
    content-visibility 200ms;
  transition:
    height 200ms var(--ease-ui),
    opacity 200ms var(--ease-ui),
    content-visibility 200ms allow-discrete;
}

.faq-accordion[open]::details-content {
  height: auto;
  opacity: 1;
  /* Opening. Reveals get a longer beat than collapses. Same two-shorthand
     pattern as the closed state. */
  transition:
    height 250ms var(--ease-ui),
    opacity 250ms var(--ease-ui),
    content-visibility 250ms;
  transition:
    height 250ms var(--ease-ui),
    opacity 250ms var(--ease-ui),
    content-visibility 250ms allow-discrete;
}
```

(Deliberate choice: duplicate shorthands, not shorthand-then-longhand — a
later *shorthand* resets every sub-property it spans, so longhand-first +
shorthand-second would silently erase the fallback; duplicate shorthands
avoid both traps and match the MDN example.)

## Repo conventions to follow

- Motion token `var(--ease-ui)` from `@theme` — never hand-typed.
- Motion CSS lives in `src/styles/global.css` with explanatory comments —
  exemplar: the `Mobile navbar menu…` block, which documents its
  compatibility approach in-comment the same way.
- Reduced motion: nothing new — the global clamp (now also zeroing
  `animation-delay` since plan 007) governs this block's transitions.

## Steps

1. In `src/styles/global.css`, locate the two `.faq-accordion…` rules above
   and replace the pair with the end-state block from **Target**, verbatim.
2. Nothing else. No markup, no JS, no other rule.

## Boundaries

- Do NOT touch the `interpolate-size: allow-keywords;` `:root` declaration
  or the `.faq-accordion` height/opacity/overflow declarations.
- Do NOT change any duration (200/250), curve, or the mobile-menu /
  product-in / wa-float blocks.
- Do NOT "simplify" the duplicate declaration to one line — the redundancy
  IS the fallback.
- Do NOT add a `prefers-reduced-motion` query (global clamp covers it).
- If the current rule pair differs from the excerpt above (drift), STOP and
  report instead of improvising.

## Verification

- **Mechanical**: `npm run build` passes; the compiled `dist/_astro/*.css`
  keeps BOTH declarations for each rule (Lightning CSS may compact them, but
  must not drop `allow-discrete`), i.e. the file contains
  `content-visibility .2s allow-discrete` and
  `content-visibility .25s allow-discrete` exactly twice each, preserving at
  least one `allow-discrete`-free fallback per rule.
- **Feel check** (`npm run dev`, Chromium 131+ where plan 001 animates):
  - FAQ open: same 250ms reveal as before (unchanged by this plan — that's
    the point); close: same 200ms.
  - Rapid toggle: still retargets.
  - No layout regime change: answers don't clip mid-sentence at any point
    during the animation.
- **Fallback spot-check** (optional but ideal): in a browser
  Formula/flags-forced to pre-`allow-discrete` behavior, confirm the
  accordion still animates `height`/`opacity` (not instant) — the bug this
  plan exists to kill.
- **Done when**: build passes, compiled CSS retains both declarations and
  `allow-discrete`, FAQ animation is visually identical to bf258bc behavior
  on modern browsers.

## Notes for the reviewer

- This plan cannot make the FAQ look different on a modern browser — treat
  any visual change as a regression, not a tuning opportunity.
