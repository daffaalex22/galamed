# 004 — Harden the mobile menu entrance (JS-sequenced open/close)

- **Status**: DONE
- **Commit**: b6b7003 + commits `374086b`/`b6b7003` contain plans 001–002;
  plan 003 is applied in the working tree. All anchors below are relative to
  the post-003 state of both files.
- **Severity**: MEDIUM
- **Category**: Compatibility & feel (accessibility of motion across engines)
- **Estimated scope**: 2 files, ~20 lines CSS replaced + ~15 lines JS in
  `Navbar.astro`
- **Supersedes**: the JS-independent mechanism of plan 003 (still DONE-safe —
  this plan replaces it; read 003 only for context, do not re-apply it).

## Problem

The live defect, reported by the product owner during a manual feel-check of
plan 003's result:

- **Close** animates (slide-fade up) — correct.
- **Open** is instant — the menu pops in, no entrance animation.

Plan 003's open path requires `@starting-style` (to seed values when an
element first renders out of `display: none`). The exit path only needs the
transition + `display … allow-discrete`. Support is gated one engine version
apart (Chrome/Edge 116→117, Safari 17.4→17.5), so on engines in that slot the
menu closes smoothly and snaps open — a visible inconsistency. The recipe
also ships `allow-discrete` inside the `transition` shorthand, which parsers
that reject the keyword may discard whole (killing exit motion too) — an
avoidable risk.

**Current code — `src/styles/global.css:132-157` (post-003, to be REPLACED):**

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

**Current code — `src/components/Navbar.astro:52-66` (script, to be
REPLACED):**

```js
<script>
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
</script>
```

## Target

JS-sequenced open/close with no `@starting-style` and no `allow-discrete` —
every engine with CSS transitions (universal, since ~2013) animates both
directions. Motion properties, duration, and curve are unchanged from plan
003 (`opacity` + `translateY(-0.5rem)`, 200ms, `var(--ease-ui)`).

**State ownership:**

- **Closed** = `hidden` (Tailwind `display: none`) **and** the base CSS state
  `opacity: 0; transform: translateY(-0.5rem)`.
- **Opening** = the script removes `hidden`, forces one style flush so the
  browser commits the closed state as the transition start, then adds
  `.menu-open`.
- **Open** = `.menu-open` present (base CSS values overridden).
- **Closing** = the script removes `.menu-open` → transitions to the closed
  values → re-adds `hidden` **220ms later** (timer, 20ms headroom over the
  200ms duration). The timer is cancelled by any new open, so rapid
  open→close→open never strands the menu in `display: none`.
- **Link-click close** stays instant: the page is already scrolling away to
  an anchor; no beat needed.

**Exact CSS to replace the post-003 block with (same location; full block
including comment):**

```css
/* ============================================================
   Mobile navbar menu (used by #mobile-menu in
   src/components/Navbar.astro). Open/close is JS-sequenced:
   the script removes `hidden` and adds `.menu-open` in the
   same style-flush for opening, and re-adds `hidden` after the
   transition for closing (timer in the script). Motion is
   opacity + translate, 200ms, var(--ease-ui). Deliberately no
   @starting-style / allow-discrete: works in every engine with
   CSS transitions.
   ============================================================ */
#mobile-menu {
  opacity: 0;
  transform: translateY(-0.5rem);
  transition-property: opacity, transform;
  transition-duration: 200ms;
  transition-timing-function: var(--ease-ui);
}

#mobile-menu.menu-open {
  opacity: 1;
  transform: none;
}
```

**Exact new script for `src/components/Navbar.astro:52-66` (whole `<script>`
block):**

```astro
<script>
  const btn = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  let closeTimer;

  function setMenu(open) {
    if (!menu) return;
    clearTimeout(closeTimer);
    if (open) {
      // Flush pending styles so the closed state is committed as the
      // transition start, then reveal — the transition runs in one frame.
      menu.classList.remove('hidden');
      void menu.offsetHeight;
      menu.classList.add('menu-open');
    } else {
      menu.classList.remove('menu-open');
      // Reapply display:none only after the 200ms close transition ends.
      closeTimer = setTimeout(() => menu.classList.add('hidden'), 220);
    }
  }

  btn?.addEventListener('click', () => setMenu(!menu.classList.contains('menu-open')));

  menu?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      // Link navigation scrolls the page instantly — close without a beat.
      clearTimeout(closeTimer);
      menu.classList.add('hidden');
      menu.classList.remove('menu-open');
      btn?.setAttribute('aria-expanded', 'false');
      btn?.setAttribute('aria-label', 'Buka menu');
    })
  );
</script>
```

The script owns the aria attributes, so they stay here — keep them
immediate on click (a11y behavior identical to today).

## Repo conventions to follow

- Motion curves reference `var(--ease-ui)` from `@theme` — never hand-typed.
- Motion CSS lives in `src/styles/global.css` with explanatory block
  comments — exemplar: the `Product filter/search bridge…` block.
- Reduced motion is handled once, globally (the clamp zeroes transition
  durations). Under the clamp the close timer still re-adds `hidden` after
  220ms — the menu is at `opacity: 0` throughout, so nothing flashes.
- Script style: terse inline listeners, low-abstraction — exemplar: the
  existing catalog script in `src/pages/index.astro`.

## Steps

1. **Replace the CSS.** In `src/styles/global.css`, delete the entire
   post-003 `#mobile-menu` block (comment header through the
   `#mobile-menu:not(.hidden)` rule) and insert the new block from the
   **Target** section in its place, at the same location.

2. **Replace the script.** In `src/components/Navbar.astro`, replace the
   whole `<script> … </script>` block (lines 52-66) with the new script from
   the **Target** section. Markup above it is untouched.

3. Nothing else.

## Boundaries

- Do NOT change the nav markup (hamburger button, links, classes) — state
  lives in classes this script controls.
- Do NOT animate `#mobile-menu a` links themselves.
- Do NOT reintroduce `@starting-style`, `transition-behavior`, or
  `allow-discrete` anywhere in this section.
- Do NOT change the 220ms timer constant (it must exceed the 200ms
  duration); do not switch to `transitionend` listeners.
- Do NOT add a `prefers-reduced-motion` media query (global clamp covers it).
- Do NOT add dependencies or focus-trap/Escape-key handling (out of scope).
- If the files differ from the excerpts above (drift), STOP and report
  instead of improvising.

## Verification

- **Mechanical**: `npm run build` completes; compiled `dist/_astro/*.css`
  contains `#mobile-menu` rules with longhand transitions and NO
  `@starting-style`; `src/components/Navbar.astro` compiles into the page
  bundle.
- **Feel check** (resize below the `lg:` breakpoint):
  - Open: menu fades + drops 8px into place, 200ms — **in the previously
    failing browser AND in current Chrome/Edge** (this plan's whole point).
  - Close: slide-fade up, 200ms, and `display: none` applies after the
    animation — confirm in DevTools that the element keeps rendering during
    the fade (Styles panel: `hidden` absent until ~220ms after the click).
  - Rapid open→close→open: menu transitions from wherever it currently is —
    never snapping, never stuck invisible (the timer cancel is what makes
    this safe; test 3 quick toggles).
  - Open menu, click "Produk": page scrolls to the catalog; menu is gone
    immediately (instant close via link handler).
  - aria: `aria-expanded` on the hamburger flips on the same click (check in
    DevTools), labels swap Buka/Tutup menu.
- **Reduced motion**: menu opens/closes instantly; nothing flashes after the
  close (opacity is already 0 when `hidden` re-applies).
- **Old-engine sanity**: if reachable, one check in Safari 17.4-era or an
  older Firefox — both directions must now animate (the whole reason this
  plan exists).
- **Done when**: open AND close both animate on all tested engines, rapid
  toggling never strands the menu, link navigation closes instantly, build
  passes.
