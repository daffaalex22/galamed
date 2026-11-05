# 002 — Bridge the product filter/search re-entrance (no teleport)

- **Status**: DONE
- **Commit**: f6e4631 + uncommitted plan 001 already applied (details/summary
  class `faq-accordion` and the FAQ CSS block exist in both files). All
  anchors below are relative to that post-001 state.
- **Severity**: MEDIUM
- **Category**: Missed opportunities (preventing a jarring change)
- **Estimated scope**: 2 files, ~15 lines CSS + ~4 lines JS

## Problem

On the homepage catalog, searching and category filtering instantly toggle
cards between `hidden` and visible. The result is a teleport: the grid
reflows with no bridge, cards pop in and out, and the empty state snaps into
existence. This is the same family of jarring state change plan 001 fixed for
the FAQ.

**Current code — `src/pages/index.astro:295-329` (the `<script>` at the end of
the file):**

```js
const search = document.getElementById('product-search');
const buttons = [...document.querySelectorAll('#product-filters button')];
const cards = [...document.querySelectorAll('#product-grid > div')];
const count = document.getElementById('product-count');
const empty = document.getElementById('product-empty');
let activeCat = 'Semua';

function apply() {
  const q = (search?.value ?? '').toLowerCase().trim();
  let shown = 0;
  cards.forEach((el) => {
    const matchCat = activeCat === 'Semua' || el.dataset.cat === activeCat;
    const matchQ = !q || el.dataset.name?.includes(q);
    const show = matchCat && matchQ;
    el.classList.toggle('hidden', !show);
    if (show) shown++;
  });
  if (count) count.textContent = `${shown} dari ${cards.length} produk`;
  empty?.classList.toggle('hidden', shown > 0);
}

buttons.forEach((b) =>
  b.addEventListener('click', () => {
    activeCat = b.dataset.cat ?? 'Semua';
    buttons.forEach((x) => {
      const on = x === b;
      x.className = `min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-navy-800 hover:border-brand-700 hover:text-brand-700'}`;
    });
    apply();
  })
);
search?.addEventListener('input', apply);
apply();
```

**The grid and empty state markup — `src/pages/index.astro:242-251`:**

```astro
<div id="product-grid" class="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
  {products.map((p) => (
    <div data-name={p.name.toLowerCase()} data-cat={p.category}>
      <ProductCard product={p} />
    </div>
  ))}
</div>
<p id="product-empty" class="hidden rounded-xl border border-dashed p-6 text-center text-slate-500">
  Tidak ada produk yang cocok. Coba kata kunci lain atau hubungi kami via WhatsApp.
</p>
```

## Target

A CSS keyframe entrance for cards that come back into the grid after a filter
or search change, plus the same treatment for the empty state. Two deliberate
properties:

1. **No extra JS restart logic.** The wrapper `<div>`s go through
   `display: none` when hidden. Per the CSS spec an element not rendered does
   not run animations, so returning to the render tree *replays* the animation
   natively when the `hidden` class is removed. Toggling `hidden` is already
   all the restart mechanism we need — cards that stay matched keep playing
   nothing (they never left the render tree), so typing quickly never
   re-animates already-visible cards.
2. **Suppressed on initial page render.** CSS animations would also play once
   on first load; this site is SEO-first and the catalog must paint instantly
   (a settled decision from the earlier animation-opportunities sweep). The
   animation is therefore gated behind an `.is-filtering` class that the
   catalog script adds on the *first user interaction* and never removes.

**Exact end state — the CSS that must exist:**

```css
@keyframes product-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
}

/* Gated behind .is-filtering so the initial page render stays instant. */
#product-grid.is-filtering > div {
  animation: product-in 180ms var(--ease-ui);
}

/* The empty state starts display:none (class "hidden"), so it can only
   ever enter during a filter/search interaction — no gate needed. */
#product-empty:not(.hidden) {
  animation: product-in 180ms var(--ease-ui);
}
```

Values: 180ms (inside the 150–250ms UI-entrance budget), curve
`var(--ease-ui)` = `cubic-bezier(0.23, 1, 0.32, 1)` (add in plan 001, already
present), entrance frame `scale(0.97)` + `opacity: 0` per the "never scale(0)"
rule.

**Exact end state — the script (changed lines marked):**

```js
const search = document.getElementById('product-search');
const buttons = [...document.querySelectorAll('#product-filters button')];
const cards = [...document.querySelectorAll('#product-grid > div')];
const grid = document.getElementById('product-grid');   // ← added
const count = document.getElementById('product-count');
const empty = document.getElementById('product-empty');
let activeCat = 'Semua';

function apply() {
  /* unchanged — do not edit the body of apply() */
}

buttons.forEach((b) =>
  b.addEventListener('click', () => {
    grid?.classList.add('is-filtering');                // ← added, first line of handler
    activeCat = b.dataset.cat ?? 'Semua';
    buttons.forEach((x) => {
      const on = x === b;
      x.className = `min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-navy-800 hover:border-brand-700 hover:text-brand-700'}`;
    });
    apply();
  })
);
search?.addEventListener('input', () => {
  grid?.classList.add('is-filtering');                  // ← added
  apply();
});
apply();
```

The class is added but never removed — once the user has interacted with the
catalog, subsequent filter changes keep animating for the life of the page.

## Repo conventions to follow

- The `--ease-ui` motion token added by plan 001 lives in `@theme` in
  `src/styles/global.css`; reuse it — do not hand-type the cubic-bezier.
- Motion CSS lives in `src/styles/global.css` with explanatory block comments
  — exemplar: the FAQ accordion block (see the
  `FAQ accordion (used by <details class="faq-accordion">…)` comment block).
- Reduced motion is handled once, globally, in `src/styles/global.css`
  (`prefers-reduced-motion` clamp that zeroes all animation/transition
  durations). Do NOT add a second media query.
- Exemplar for the script style: the existing catalog script's terse inline
  listeners — extend them in place, don't restructure.

## Steps

1. **Add the keyframe + rules.** In `src/styles/global.css`, insert the block
   from the **Target** section immediately AFTER the closing `}` of
   `.faq-accordion[open]::details-content { … }` (currently ends around line
   106) and BEFORE the `:focus-visible {` rule (currently line 108). Include
   the two explanatory comments exactly as written.

2. **Add the grid reference.** In `src/pages/index.astro` in the trailing
   `<script>`, immediately after the `const cards = [...]` line, add:
   `const grid = document.getElementById('product-grid');`

3. **Gate on first interaction — filter buttons.** Inside the
   `buttons.forEach((b) => b.addEventListener('click', () => { … }));`
   handler, make `grid?.classList.add('is-filtering');` the first statement,
   before `activeCat = b.dataset.cat ?? 'Semua';`.

4. **Gate on first interaction — search.** Replace
   `search?.addEventListener('input', apply);` with:

   ```js
   search?.addEventListener('input', () => {
     grid?.classList.add('is-filtering');
     apply();
   });
   ```

5. Do not change `apply()` or anything else in the script.

## Boundaries

- Do NOT touch `ProductCard.astro` — its existing hover transitions are by
  design and out of scope.
- Do NOT animate the `#product-count` line or add an exit animation for cards
  leaving the grid (display removal can't transition cheaply here and the
  reflow it would mask is immediate grid re-layout — entrance-only is the
  deliberate scope).
- Do NOT add a stagger between re-appearing cards. All-at-once at 180ms is
  the right weight for this crisp B2B site; stagger would add decoration.
- Do NOT use `void el.offsetWidth` restart hacks or add/remove an animation
  class per typement — the display:none toggle IS the restart mechanism.
- Do NOT add a `prefers-reduced-motion` media query (global clamp covers it).
- Do NOT add dependencies.
- If `src/pages/index.astro:242-251` / the trailing `<script>` or the
  post-001 state of `src/styles/global.css` differs from the excerpts above,
  STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` completes with no CSS errors; the compiled
  `dist/_astro/*.css` contains `product-in` and the `.is-filtering` rule.
- **Feel check** (`npm run dev`; any modern browser — this plan uses plain
  keyframes, so Chromium/Edge 131+ is not required):
  - Initial load: the catalog is fully visible instantly — no fade-in on any
    card. Scroll between reloads just to be sure: reload must never show the
    animation.
  - Type "roll" into the search box: cards that return fade-scale in as one
    crisp 180ms beat; cards that were already visible (e.g. "kasa hidrofil
    roll" while typing "r" → "ro" → "roll") must NOT re-animate. Continue
    typing quickly: no flicker of already-shown cards.
  - Clear the search: the full grid fades back in once, no repeated pulses.
  - Click a category chip: cards that were visible before and remain matched
    must hold still — only newly appearing cards animate.
  - Type a nonsense string ("zzz"): the empty-state box fades in with the same
    180ms beat instead of snapping.
  - Slow-motion via DevTools → Animations panel at 10%: cards go from
    `scale(0.97)` + transparent to `scale(1)` opaque, no overshoot, no
    layout-triggered jump beyond the opacity/scale beat.
- **Reduced motion**: with `prefers-reduced-motion` toggled in the Rendering
  panel, filtering is instant (global clamp) — same behavior as today.
- **Done when**: initial render is unanimated, every post-interaction
  re-entrance carries the 180ms beat, already-shown cards never re-animate on
  rapid typing, the empty state fades in, build passes.

## Notes for the reviewer

- One feel-datapoint can't be judged from code alone: whether 180ms reads
  fast or slow over the 7-card grid. If it feels rushed in the slow-motion
  check, the plan's knob is the `180ms` value — tune within 150–250ms, do not
  change the curve.
