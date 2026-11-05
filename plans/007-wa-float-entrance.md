# 007 — Let the WhatsApp float arrive, not materialize

- **Status**: DONE
- **Commit**: e098b14
- **Severity**: LOW (delight-tier polish; the only "rare frequency" item in
  the sweep)
- **Category**: Missed opportunities (delight budget / preventing a jarring
  appearance)
- **Estimated scope**: 2 files, ~15 lines CSS + 1 class attribute
- **Maps to**: opportunity ⑥ of the find-animation-opportunities sweep

## Problem

The floating WhatsApp button is the last element in `<body>`
(`src/layouts/BaseLayout.astro:193`, `fixed bottom-6 right-6`) and simply
*exists* from the first paint — no arrival, no beat. Every other motion on
the site answers "why does this animate?"; this one earns it via the
rare/first-time tier: a once-per-page-load moment, where a slightly
generous entrance is allowed by the audit rules (UI < 300ms does NOT apply —
rare-tier delight can take a longer beat).

**Current anchor — `src/components/WhatsAppFloat.astro:7-14` (post-005;
markup to gain one class):**

```astro
<a
  href={waLink}
  target="_blank"
  rel="noopener"
  aria-label="Chat WhatsApp Galamed"
  title="Chat WhatsApp Galamed"
  class="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-wa-500 text-white shadow-xl transition hover:-translate-y-1 hover:bg-wa-600 hover:shadow-2xl active:scale-[0.98]"
>
```

**Context — the global reduced-motion clamp (`src/styles/global.css`, last
block):**

```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Gap this plan closes:** the clamp zeroes `animation-duration` but not
`animation-delay`. A bare implementation of this entrance (600ms delay)
would leave reduced-motion users with an invisible button for 600ms — a
regression against today's instant appearance. The fix extends the existing
clamp (the convention: one global block, never per-feature queries) with a
delay reset.

## Target

A once-per-load entrance on the float only: rise a quarter of its own height
(28% ≈ the 56px button), fade in, settle. No bounce, no ring, no re-trigger.
Anchor navigations (`#products`, etc.) don't reload the page, so the
animation never replays mid-session — by design.

Why `transform` in the keyframe is safe here: Tailwind v4 compiles the
button's existing `hover:-translate-y-1` to the independent `translate`
property and `active:scale-[0.98]` to the independent `scale` property —
neither collides with a `transform` animation, so hover/press during and
after the entrance compose cleanly. Do not "correct" this into other
properties.

**Exact CSS to add to `src/styles/global.css`:**

```css
/* ============================================================
   WhatsApp float entrance (the anchor in src/components/
   WhatsAppFloat.astro via BaseLayout). Once per page load:
   rises 28% of its own height while fading in, after a 600ms
   beat so it arrives after the page settles. animation-delay is
   intentionally NOT reset for reduced motion here — the global
   reduced-motion block now zeroes animation-delay too, see below.
   ============================================================ */
@keyframes wa-float-in {
  from {
    opacity: 0;
    transform: translateY(28%) scale(0.9);
  }
}

.wa-float {
  animation: wa-float-in 400ms var(--ease-ui) 600ms backwards;
}
```

Values: `backwards` fill is load-bearing — it holds the `from` state
(invisible) during the 600ms delay so the button doesn't flash fully
visible before jumping back to start. 400ms slow enough to read as an
arrival, still under half the UI budget because this is the rare tier;
`var(--ease-ui)` for the decelerating settle. `translateY(28%)` derives
from the element's own height (56px → ≈16px) — no hardcoded pixels.

**Exact extension of the existing reduced-motion block** (add one
declaration + comment inside the existing `@media` block — it is a stretch
of the global pattern, not a second query):

```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    /* Delay zeroed too: a waiting animation (e.g. the WhatsApp float
       entrance) must not hold content invisible for its delay under
       reduced motion. */
    animation-delay: 0s !important;
  }
}
```

**Exact markup change — `src/components/WhatsAppFloat.astro:13`:**

```
  class="wa-float fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-wa-500 text-white shadow-xl transition hover:-translate-y-1 hover:bg-wa-600 hover:shadow-2xl active:scale-[0.98]"
```

(`wa-float` first, so the hook class leads the list, mirroring the
`faq-accordion` pattern from plan 001.)

## Repo conventions to follow

- Motion tokens from `@theme` — `var(--ease-ui)` is the site's curve.
- Motion CSS lives in `src/styles/global.css` with explanatory block
  comments — exemplar: the `Product filter/search bridge…` block.
- Reduced motion handled once, globally, in the existing clamp — extend it,
  never fork it.
- CSS-only; no JS. Exemplar: plan 001 (hook class + global CSS block).

## Steps

1. In `src/styles/global.css`, extend the existing `@media
   (prefers-reduced-motion: reduce)` block with `animation-delay: 0s
   !important;` plus the comment exactly as written in **Target**.
2. In `src/styles/global.css`, insert the keyframe + `.wa-float` block immediately
   AFTER the closing `}` of the `#mobile-menu.menu-open { … }` rule and
   BEFORE the `:focus-visible {` rule.
3. In `src/components/WhatsAppFloat.astro:13`, prepend `wa-float ` to the
   class attribute (post-005 string; full end state above).
4. Nothing else.

## Boundaries

- Do NOT add a pulsing ring, attention ping, badge, or label on the float
  (explicitly rejected in the sweep — a pulsing badge on a healthcare B2B
  site reads as spam).
- Do NOT add `will-change`, a JS observer, or an IntersectionObserver.
- Do NOT touch the hover/active tokens on the float (`transition`,
  `hover:-translate-y-1`, `active:scale-[0.98]` stay byte-identical).
- Do NOT touch any other file except the two named.
- If `src/components/WhatsAppFloat.astro:7-14` or `src/styles/global.css`
  differs from the excerpts above (drift), STOP and report instead of
  improvising.

## Verification

- **Mechanical**: `npm run build` passes; compiled `dist/_astro/*.css`
  contains `wa-float-in` and the `.wa-float` rule, and the reduced-motion
  block now includes `animation-delay:0s`.
- **Feel check** (`npm run dev`, any modern browser; hard-reload with
  DevTools → Network throttle "Fast 4G" to see the beat at work):
  - On load: page paints first; ~600ms later the float rises ~16px while
    fading in over 400ms, decelerating — one arrival, softer than the site's
    UI beats, then nothing.
  - Reload must NOT re-run the animation on in-page anchor navigation (it
    doesn't — anchors don't reload).
  - During the entrance, hover the float mid-rise: the fade completes first,
    then the hover translate/background state engages cleanly (independent
    composited properties compose) — no snapping or double-stack.
  - Press the float after it has settled: the 0.98 compress from plan 005
    still feels normal, unchanged.
  - Slow-motion check at 10% (Animations panel): the rise and fade end
    together; the settle lands into place without bounce/overshoot.
- **Reduced motion**: toggle `prefers-reduced-motion` in the Rendering
  panel — the float appears instantly at first paint (delay zero, duration
  ~0), never a 600ms invisible window.
- **Done when**: hard reloads show one 400ms arrival after the ~600ms beat,
  anchor navigation doesn't replay, hover/press compose during and after
  the entrance, reduced motion is instant, build passes.

## Notes for the reviewer

- Two taste calls, honestly un-verifiable from code: (a) the 600ms delay —
  if it feels like the button "forgot to load" rather than arriving, lower
  to 300–400ms; (b) the 28% rise — if it reads as cartoonish on the 56px
  circle, halve it. Both are knobs with unchanged code shape; do not layer
  extra motion (bounce/overshoot) to "fix" either.
