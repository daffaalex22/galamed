# 001 — Animate the homepage FAQ accordion open/close

- **Status**: DONE
- **Commit**: f6e4631
- **Severity**: MEDIUM
- **Category**: Missed opportunities (state indication / preventing a jarring change)
- **Estimated scope**: 2 files, ~25 lines of CSS + 1 class attribute

## Problem

The homepage FAQ (7 items) uses plain `<details>` elements whose answer text
snaps open with a full height jump. Only the `+` icon rotates (already handled
via `group-open:rotate-45`). The sudden height jump is exactly the kind of
"teleporting state change" this interface's surrounding motion vocabulary
(hover lifts, smooth scroll) does not match — opening a question feels less
polished than hovering a product card.

**Current code — `src/pages/index.astro:274-284`:**

```astro
{faq.map((item) => (
  <details class="group px-5">
    <summary class="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-navy-800 transition-colors [&::-webkit-details-marker]:hidden hover:text-brand-700">
      {item.q}
      <svg class="h-4 w-4 shrink-0 text-brand-700 transition-transform duration-200 group-open:rotate-45" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1Z" />
      </svg>
    </summary>
    <p class="pb-5 text-sm leading-relaxed text-slate-600">{item.a}</p>
  </details>
))}
```

No transition exists on the reveal of the answer paragraph (`index.astro:282`,
`<p class="pb-5 …">{item.a}</p>`), so opening and closing both happen in a
single frame.

## Target

Modern CSS-only accordion animation using `::details-content` +
`interpolate-size: allow-keywords` (progressive enhancement: browsers without
support simply keep today's instant behavior — nothing breaks). Transitions,
not keyframes, so spam toggling a question mid-animation retargets smoothly
instead of restarting from zero. Asymmetric timing: opening gets a slightly
longer beat (250ms) than closing (200ms) — reveal wants the moment, collapse
wants to get out of the way.

**Exact CSS to add to `src/styles/global.css`:**

```css
/* ============================================================
   FAQ accordion (used by <details class="faq-accordion"> in
   src/pages/index.astro). Progressive enhancement: browsers
   without ::details-content / interpolate-size keep the
   current instant open/close.
   ============================================================ */
:root {
  /* Lets `height: auto` participate in transitions. */
  interpolate-size: allow-keywords;
}

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

**Exact token to add to the `@theme` block in `src/styles/global.css`** (place
it after the `--color-ink-600` line, keeping the file's existing grouping of
font/color tokens followed by motion values):

```css
  /* Motion: strong ease-out for UI state changes (opens, reveals). */
  --ease-ui: cubic-bezier(0.23, 1, 0.32, 1);
```

**Exact markup change in `src/pages/index.astro:275`:**

```astro
<details class="faq-accordion group px-5">
```

## Repo conventions to follow

- All custom design tokens live in the single `@theme` block in
  `src/styles/global.css:3-46` (colors, fonts). Motion curves belong in the
  same block, not scattered in component styles.
- Reduced motion is already handled globally in `src/styles/global.css:79-89`:
  every transition/animation duration is clamped to 0.01ms under
  `prefers-reduced-motion`, so the accordion opens instantly for those users.
  Do NOT add a second media query for this — the global clamp is the
  codebase's deliberate pattern.
- Exemplar of the existing transition style this joins:
  `src/pages/index.astro:278` (`transition-transform duration-200` on the FAQ
  icon) — CSS-only, Tailwind v4, no motion library.

## Steps

1. **Add the easing token.** In `src/styles/global.css`, inside the `@theme` block, after the `--color-ink-600: #475569;` line (line 45), insert:

   ```css
   /* Motion: strong ease-out for UI state changes (opens, reveals). */
   --ease-ui: cubic-bezier(0.23, 1, 0.32, 1);
   ```

   Note: Tailwind v4 auto-generates an `ease-ui` utility from this var. Nothing
   else in the repo uses `ease-*` theme keys, so there is no collision and no
   override of Tailwind's built-in `ease-out`.

2. **Add the accordion CSS.** In `src/styles/global.css`, after the
   `button:not(:disabled)` rule (ends line 71) and before `:focus-visible`
   (line 73), insert the `:root` + `.faq-accordion` rules exactly as written in
   the **Target** section, including the header comment block.

3. **Add the hook class in markup.** In `src/pages/index.astro:275`, change
   `<details class="group px-5">` to `<details class="faq-accordion group px-5">`.

4. Do not touch anything else in either file.

## Boundaries

- Do NOT touch `src/pages/index.astro` beyond the one class attribute on the
  `<details>` element — no markup restructuring, no wrapping elements.
- Do NOT touch the `<summary>`, the icon, or the answer `<p>` — the icon
  rotation already exists and is correct.
- Do NOT add any dependency, script, or JS toggle — this is CSS-only.
- Do NOT add a `prefers-reduced-motion` media query — the global clamp in
  `src/styles/global.css:79-89` already covers it.
- Do NOT apply `.faq-accordion`-scoped styles to `<details>` globally (the
  class exists so future CMS content with plain `<details>` is unaffected).
- If the code at `src/pages/index.astro:274-284` or `src/styles/global.css`
  differs from the excerpts above (drift since commit f6e4631), STOP and
  report instead of improvising.

## Verification

- **Mechanical**: run `npm run build` (or `npm run dev`) and confirm the build
  completes with no CSS errors and the FAQ renders.
- **Feel check** (run in Chrome/Edge 131+, the browsers shipping
  `::details-content`):
  - Click a question: the answer slides open ~250ms, decelerating smoothly
    (fast start), while fading in slightly — no vertical jump, no double-
    render flash.
  - Click it again mid-open: the animation retargets and collapses from its
    current position — it never snaps back to fully closed before shrinking.
  - Rapidly toggle the same question 5×: it stays coherent, never restarts
    from zero.
  - In DevTools → Animations panel, set playback to 10%: height and opacity
    move together, opacity finishes subtly behind the height, and the
    surrounding layout (the bordered card + `divide-y` separators at
    `index.astro:273`) reflows with the reveal rather than jumping.
  - Collapsing should feel slightly snappier than opening.
- **Reduced motion**: toggle `prefers-reduced-motion` in the Rendering panel —
  the answer appears instantly on open (global clamp), content is still fully
  readable.
- **Fallback**: in a browser without `::details-content` support (e.g. older
  Firefox), opening must behave exactly as today — instant open/close, no
  broken or stuck-hidden answer.
- **Done when**: all questions open/close with the transitioned height, spam
  toggling retargets cleanly, reduced motion is instant, fallback browsers
  show no regression, and `npm run build` passes.
