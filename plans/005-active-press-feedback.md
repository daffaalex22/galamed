# 005 — Standardize `:active` press feedback on button-shaped controls

- **Status**: DONE
- **Commit**: 061b76e
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens + Physicality (press feedback)
- **Estimated scope**: 5 files, 8 class-attribute edits, 0 CSS lines added
- **Maps to**: opportunity ④ of the find-animation-opportunities sweep

## Problem

Press feedback (`active:scale-[0.98]` + a transition) exists in exactly one
place in the site — `QuoteForm.astro:56` — while seven other button-shaped
controls (every "Minta penawaran" CTA, the details-page CTA pair, the
WhatsApp float, the hamburger) either have **no** press feedback or a
competing pattern (`active:translate-y-0` — a dead-end token that fights the
existing hover lift instead of compressing). Pressing any primary CTA gives
no acknowledgment; the interface treats the most common gesture in the
category hierarchy as a no-op. Frequency: tens of presses/session — the
audit tier where press feedback should be near-imperceptible-but-present,
which is precisely what a uniform 2% compress is.

**The repo precedent the plan extends (do not touch, just imitate) —
`src/components/QuoteForm.astro:54-56`:**

```astro
<button
  type="submit"
  class="min-h-[44px] min-w-0 flex-1 cursor-pointer rounded-lg bg-wa-500 px-4 py-3 font-bold text-white transition hover:bg-wa-600 hover:shadow-lg hover:shadow-wa-500/25 active:scale-[0.98] sm:px-6"
>
```

Note the utility ordering convention: `active:` token last, after the `hover:`
tokens (or at the string end) — every edit below follows that placement.

**Why no CSS/token changes are needed:** all target elements except the
hamburger already carry Tailwind's `transition` class; in Tailwind v4 its
default `transition-property` covers `scale` (v4 animates the independent
`scale` property) at the default 150ms duration — inside the 100–160ms press
feedback budget. `QuoteForm.astro:56` proves the pattern compiles and works
in this codebase.

## Target

One uniform press token on all button-shaped controls:
`active:scale-[0.98]`. Replace the two `active:translate-y-0` tokens with it.

**Exact end states — each file's class strings after the edits:**

1. `src/pages/index.astro:101` (hero primary CTA):
   ```
   class="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md active:scale-[0.98]"
   ```
2. `src/pages/index.astro:107` (hero secondary CTA):
   ```
   class="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-brand-700 bg-transparent px-6 py-3 font-semibold text-brand-700 transition hover:bg-white active:scale-[0.98]"
   ```
3. `src/pages/produk/[slug].astro:159` (product primary CTA):
   ```
   class="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md active:scale-[0.98]"
   ```
4. `src/pages/produk/[slug].astro:165` (product secondary CTA):
   ```
   class="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-brand-700 bg-transparent px-6 py-3 font-semibold text-brand-700 transition hover:bg-white active:scale-[0.98]"
   ```
5. `src/components/Navbar.astro:25` (nav CTA — replaces
   `active:translate-y-0`):
   ```
   class="inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md active:scale-[0.98] sm:px-4"
   ```
6. `src/components/Navbar.astro:32` (hamburger button — gains `transition`
   too, it currently has none):
   ```
   class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 text-navy-800 transition active:scale-[0.98] lg:hidden"
   ```
7. `src/components/WhatsAppFloat.astro:13` (float — replaces
   `active:translate-y-0`):
   ```
   class="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-wa-500 text-white shadow-xl transition hover:-translate-y-1 hover:bg-wa-600 hover:shadow-2xl active:scale-[0.98]"
   ```
8. `src/components/QuoteForm.astro:67` (email button *inside the quote
   card* — sits directly beside the submit button that already scales;
   leaving it out would re-create the exact inconsistency this plan exists
   to kill):
   ```
   class="min-h-[44px] inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-white/30 px-4 py-3 text-sm font-semibold transition hover:bg-white/10 hover:border-white/50 active:scale-[0.98] sm:px-6 sm:text-base"
   ```

## Deliberately excluded (reviewer-visible decisions)

- **Filter chips** (`src/pages/index.astro:231-237`): a chip's selection
  state already flips its border/background — that color swap IS its press
  feedback, and a scale compress across a horizontal row of chips reads as
  wiggle.
- **Product-card "Minta penawaran" text links** and desktop nav text links
  (`ProductCard.astro:56`, `Navbar.astro:14-18`): text links' press language
  is color; scale on inline text looks wobbly and was already rejected for
  nav in the sweep.
- **`active:scale` values other than 0.98**: one token, whole site. Any
  deviation needs a reason.

## Repo conventions to follow

- Utility ordering: `active:` after `hover:`, before the responsive
  (`sm:`/`lg:`) suffix — as in the QuoteForm precedent and every end state
  above.
- Tailwind arbitrary values (`active:scale-[0.98]`) are already in use
  site-wide (e.g. `active:translate-y-0`, `indent tokens classes`) — no
  config or plugin work.
- No global CSS, no new tokens, no JS.

## Steps

1. `src/pages/index.astro` — apply end state 1 then end state 2 (each class
   string is unique in the file).
2. `src/pages/produk/[slug].astro` — apply end state 3 then end state 4.
3. `src/components/Navbar.astro` — apply end state 5 (replace
   `active:translate-y-0`), then end state 6 (hamburger).
4. `src/components/WhatsAppFloat.astro` — apply end state 7 (replace
   `active:translate-y-0`).
5. `src/components/QuoteForm.astro` — apply end state 8 to the email
   anchor. Do not touch the submit button.
6. Nothing else.

## Boundaries

- Do NOT touch hover states, colors, durations, or any non-`active` utility.
- Do NOT add CSS files, tokens, JS, or dependencies.
- Do NOT touch the filter chips, text links, or the FAQ
  details/summary (covered by plan 001).
- Do NOT "clean up" the `transition` class on any target — it is required
  (default 150ms, includes `scale`).
- If any class string differs from the excerpts above (drift), STOP and
  report instead of improvising.

## Verification

- **Mechanical**: `npm run build` passes; compiled page CSS shows the
  generated `:active` rules containing `scale:` values (search the built
  `dist/_astro/*.css` for `:active` + `scale`).
- **Feel check** (`npm run dev`):
  - Press and hold each of the 8 controls: it compresses to ~98% within
    ~150ms and *stays* compressed while held; release returns it — no
    lingering scale, no lag.
  - Cross-check uniformity: hero CTA, product CTA, nav CTA, float, and both
    quote-card buttons press identically — one compressed amount, one timing.
  - The two `active:translate-y-0` oddities are gone: neither the nav CTA
    nor the float shows any vertical press movement now.
  - Fast-tap the hamburger twice: no visual stutter; menu behavior from plan
    004 is unaffected (feel-check 004 once more here).
  - Filter chips: press must show NO scale movement (still fine visually via
    color swap).
- **Reduced motion**: with the clamp active, the compress snaps instantly —
  still legible as press feedback; acceptable (global-clamp behavior, not a
  finding).
- **Done when**: 8 controls press with the same 0.98 compress and ~150ms,
  the two `translate-y` press tokens are gone, chips stay static, build
  passes.

## Notes for the reviewer

- 0.98 is the deliberate choice; if the press feels too faint on the large
  WhatsApp float specifically, the only permitted knob is a one-step shift to
  0.96 applied to a *class of buttons* (e.g. both large CTAs), never to a
  single DOM element. If deeper tuning tempting beyond that, revert to 0.98
  everywhere; uniformity outranks per-button taste.
