# 003 — Slide-fade the mobile menu in from the navbar

- **Status**: DONE
- **Commit**: b6b7003
- **Severity**: MEDIUM
- **Category**: Missed opportunities (spatial consistency / preventing a jarring change)
- **Estimated scope**: 1 file, ~20 lines CSS, 0 lines JS

## Problem

The `<nav>`'s mobile menu (`#mobile-menu`, hidden on `lg:` breakpoints) is
shown/hidden by toggling Tailwind's `hidden` class in
`src/components/Navbar.astro:55-59`. Both open and close happen in a single
frame: the menu pops into existence disconnected from the hamburger button
and the sticky bar it hangs below, then vanishes the same way. Menus sliding
nothing is the classic teleporting-state seam; the menu is spatially
connected to the navbar, so it should appear to come *from* the navbar.

**Current code — `src/components/Navbar.astro:41-49` (markup, unchanged by
this plan):**

```astro
<div id="mobile-menu" class="hidden border-t border-slate-100 px-4 py-3 sm:px-6 lg:hidden">
  <div class="grid gap-1 text-[15px] font-medium text-navy-800">
    <a href="#home" class="rounded px-2 py-3 hover:bg-brand-50">Beranda</a>
    ...4 more links...
  </div>
</div>
```

**Current code — `src/components/Navbar.astro:52-66` (toggle JS, unchanged by
this plan):**

```js
const btn = document.getElementById('nav-toggle');
const menu = document.getElementById('mobile-menu');
btn?.addEventListener('click', () => {
  const open = menu?.classList.toggle('hidden') === false;
  btn.setAttribute('aria-expanded', String(!!open));
  btn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
});
menu?.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    menu.classList.add('hidden');
    btn?.setAttribute('aria-expanded', 'false');
  })
);
```

## Target

CSS-only entrance/exit with zero JS changes, using the modern
`@starting-style` + discrete `display` transition recipe — the same
progressive-enhancement stance as plan 001:

- **Open**: element renders (Tailwind `hidden` class removed) →
  `@starting-style` seeds `opacity: 0; transform: translateY(-0.5rem);` →
  transitions to settled state over 200ms. The `-0.5rem` nudge reads as
  "grew down out of the bar above" without moving enough to be a cartoon.
- **Close**: the base (closed) styles are `opacity: 0;
  transform: translateY(-0.5rem);` — the transition target — while
  `display 200ms allow-discrete` keeps the element rendered until the
  animation ends, then `display: none` applies.
- **Fallback**: browsers without `@starting-style`/discrete-transition
  support behave exactly as today (instant open/close). Nothing breaks.
- Durations symmetric (200ms both ways): open/close is a toggle, not a
  press-and-release pair, so no asymmetric beats here.
- Budget: menu ≈ dropdown/drawer → 200ms is inside the 150–250ms and
  well under the 500ms drawer ceiling.

**Exact CSS to add to `src/styles/global.css` (placement in Steps):**

```css
/* ============================================================
   Mobile navbar menu (used by #mobile-menu in
   src/components/Navbar.astro). Enter/exit via opacity +
   translate. JS keeps toggling the `hidden` class unchanged:
   @starting-style seeds the entrance from display:none, and
   `display … allow-discrete` holds the element rendered during
   the exit transition. Browsers without these features get
   today's instant open/close.
   ============================================================ */
#mobile-menu {
  opacity: 0;
  transform: translateY(-0.5rem);
  transition:
    opacity 200ms var(--ease-ui),
    transform 200ms var(--ease-ui),
    display 200ms allow-discrete;

  @starting-style {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
}

#mobile-menu:not(.hidden) {
  opacity: 1;
  transform: none;
}
```

## Why the values are what they are (executor: do not change)

- `var(--ease-ui)` = `cubic-bezier(0.23, 1, 0.32, 1)`, the repo's motion
  token from plan 001. Entrance → decelerating ease-out, per AUDIT decision
  order.
- `translateY(-0.5rem)` → derives from the root font size, not a hardcoded
  pixel offset; small enough that the fade dominates, direction-correct for
  something that belongs to the bar above (never animate from below: that
  reads as arriving from off-screen / the address bar).
- Base (closed) styles exist because `@starting-style` only seeds the
  *first* render; without the base rule the exit transition would target
  opacity 1 and only the display swap would fire.
- `@starting-style` duplicates the base closed values deliberately — spec
  requires it for transitions out of `display: none`.

## Repo conventions to follow

- Motion CSS lives in `src/styles/global.css` with explanatory block
  comments — exemplar: the `Product filter/search bridge…` block added by
  plan 002.
- All curves reference `var(--ease-ui)` from `@theme` — never hand-typed.
- Reduced motion is handled once, globally, in `src/styles/global.css` (the
  clamp zeroes all transition durations). Do NOT add a media query.
- CSS-only, no JS: exemplar — plan 001's FAQ accordion changed one class,
  plan 002 changed four script lines; this plan changes zero JS.

## Steps

1. In `src/styles/global.css`, insert the CSS block from the **Target**
   section immediately AFTER the closing `}` of the
   `#product-empty:not(.hidden) { … }` rule (end of the block comment that
   reads `/* The empty state starts display:none (class "hidden") … */`)
   and BEFORE the `:focus-visible {` rule. Include the header comment
   exactly as written.

2. Do NOT touch `src/components/Navbar.astro`. At all. The existing script
   (`classList.toggle('hidden')`, `aria-expanded`, link-click closing) is
   correct and stays byte-identical.

3. Nothing else.

## Boundaries

- Do NOT change any JS in `Navbar.astro`.
- Do NOT animate the hamburger button, the desktop nav links, or the
  "Minta penawaran" CTA.
- Do NOT add transform to the links themselves (`#mobile-menu a`) — one
  element moving, translate + fade only; nested link entrances are
  decoration and the budget cap says so.
- Do NOT use `max-height`/`height` hacks on the menu container.
- Do NOT add a `prefers-reduced-motion` media query (global clamp covers it).
- Do NOT add dependencies, overlay/`@property` scaffolding, or `overlay`
  transition (the menu is not top-layer; `overlay` would be dead code).
- If `src/components/Navbar.astro:41-66` or the tail of `src/styles/global.css`
  differs from the excerpts above, STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` completes without errors; the compiled
  `dist/_astro/*.css` contains the `#mobile-menu` transition rules.
- **Feel check** (`npm run dev`, Chromium/Edge 117+ or Safari 17.5+ —
  browsers shipping `@starting-style`; resize below the `lg:` breakpoint to
  reach the hamburger):
  - Tap the hamburger: menu fades while dropping 8px into place, 200ms,
    decelerating — reads as unfolding from the bar, not appearing from
    nowhere.
  - Tap again mid-open: retargets and collapses from its current position
    (transitions, not keyframes — it never snaps shut before shrinking).
  - Tap a link: menu closes with the same slide-up fade before the anchor
    scroll begins; no double-fire.
  - Open the menu, resize the window past `lg:`: desktop nav replaces it
    without visual debris (the menu is `lg:hidden` — it simply leaves the
    render tree; confirm nothing flashes during the resize).
  - DevTools → Animations panel at 10%: opacity and the -0.5rem counter-
    translate end together; the `border-t` separator under the bar is
    already there on the container, so no double border flash during the
    slide.
- **Reduced motion**: toggle `prefers-reduced-motion` in the Rendering
  panel — menu opens/closes instantly (global clamp), fully readable.
- **Fallback**: in a browser without `@starting-style` (older Safari/Firefox),
  open and close behave exactly as today — instant.
- **Done when**: menu enters/exits with the 200ms slide-fade, spam-toggling
  retargets, link navigation still closes it (openly scroll-locks nothing),
  reduced motion and fallback browsers are instant, build passes.

## Notes for the reviewer

- One taste call can't be verified from code: whether the fade should
  dominate the translate more (e.g. `translateY(-0.375rem)`). If the slide
  reads as too much movement in the slow-motion check, the only permitted
  knob is the offset magnitude — keep the curve and 200ms timing.
