# 006 — Acknowledge the quote-form submit before WhatsApp opens

- **Status**: DONE
- **Commit**: b1cb655
- **Severity**: MEDIUM
- **Category**: Missed opportunities (feedback / state indication)
- **Estimated scope**: 1 file (`src/components/QuoteForm.astro`), ~15 lines JS,
  0 CSS, 0 markup
- **Maps to**: opportunity ⑤ of the find-animation-opportunities sweep

## Problem

Submitting the quote form calls `window.open(…, '_blank')` synchronously. On
mobile, the hand-off to the WhatsApp tab/app takes a perceivable beat (0.5–2s
— tab switch, blob redirect, sometimes an app-steer dialog). During that
whole window the form gives **zero** acknowledgment: the button looks
untouched. The natural human response is "did it work?" and a second click —
which fires a second `window.open` and produces a duplicate chat draft. This
is both a missing feedback moment and a real double-submit defect, and
Enter-in-a-field submits the form too (a disabled button alone does not
block it).

**Current code — `src/components/QuoteForm.astro:81-96` (the whole trailing
`<script>`, to be REPLACED):**

```astro
<script define:vars={{ waNumber: site.waNumber }}>
  const form = document.getElementById('quote-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const lines = [
      `Halo Galamed, saya ${data.get('name')}${data.get('jabatan') ? `, ${data.get('jabatan')}` : ''}.`,
      `Instansi/Distributor: ${data.get('orgName')}`,
      `Kontak: ${data.get('contact')}`,
      `Alamat: ${data.get('orgAddress')}`,
      `Kebutuhan produk:`,
      `${data.get('need')}`,
    ];
    const msg = lines.join('\n');
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  });
</script>
```

**Context — submit button (`QuoteForm.astro:54-64`, NOT edited):** its label
div lives in markup as

```astro
<span class="inline-flex items-center justify-center gap-2">
  <svg class="h-5 w-5" …whatsapp glyph…>…</svg>
  Kirim via WhatsApp
</span>
```

The plan swaps the button's `innerHTML` for a plain-text state label while
the hand-off is in flight; the platform styling (rounded, `bg-wa-500`,
`active:scale-[0.98]`, the `transition`) is untouched and reads as the
pressed/icon-less state.

## Target

One honest state change, no motion properties added (the button's existing
press/transition handles the physicality):

1. **Submit** → build the message exactly as today → `window.open` exactly as
   today, but capture its return value (the popup window reference, or
   `null` when the browser blocked it).
2. **If the popup opened** → enter the "opening" state: set a `busy` flag,
   disable the button, swap its label to the literal text `Membuka
   WhatsApp…`, and schedule reversion in **2500ms** (sweeps: 2.5s is long
   enough to cover the slowest realistic mobile hand-off and short enough
   that a user whose popup silently landed elsewhere isn't stranded in a
   fake state; if the page is still visible after 2.5s the button returns to
   normal, ready to click again).
3. **If the popup was blocked** (`window.open` returned `null`) → change
   NOTHING. Swapping to "Membuka WhatsApp…" while nothing opens would be a
   lie; today's silent nothing is unhelpful but at least not dishonest. (A
   blocked-popup notice is out of scope on purpose.)
4. **Re-entry guard**: re-submits while `busy` are ignored at the top of the
   handler (Enter-in-field bypasses the disabled button — the flag, not the
   button state, is what actually prevents the duplicate draft).
5. **Revert** = clear `busy`, re-enable, restore the captured original
   `innerHTML`.

Durations: revert timer = `2500` exactly. The button's existing Tailwind
`transition` (~150ms) naturally animates the color/press shift out.

**Exact new `<script>` for `src/components/QuoteForm.astro:81-…` (whole
block, replaces the current one verbatim):**

```astro
<script define:vars={{ waNumber: site.waNumber }}>
  const form = document.getElementById('quote-form');
  const btn = form?.querySelector('button[type="submit"]');
  const originalLabel = btn ? btn.innerHTML : '';
  let busy = false;

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(form);
    const lines = [
      `Halo Galamed, saya ${data.get('name')}${data.get('jabatan') ? `, ${data.get('jabatan')}` : ''}.`,
      `Instansi/Distributor: ${data.get('orgName')}`,
      `Kontak: ${data.get('contact')}`,
      `Alamat: ${data.get('orgAddress')}`,
      `Kebutuhan produk:`,
      `${data.get('need')}`,
    ];
    const msg = lines.join('\n');
    const win = window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');

    if (btn && win) {
      // Honest feedback only: show the opening state when WhatsApp ACTUALLY
      // opened. Blocked popups stay silent (same as before).
      busy = true;
      btn.disabled = true;
      btn.innerHTML = 'Membuka WhatsApp…';
      setTimeout(() => {
        busy = false;
        btn.disabled = false;
        btn.innerHTML = originalLabel;
      }, 2500);
    }
  });
</script>
```

## Repo conventions to follow

- Inline `<script define:vars>` is the file's existing pattern (the WhatsApp
  number must be injected into an inline script) — keep `define:vars` exactly.
- State via a module-scope flag + classList/DOM churn, no JS framework:
  exemplar — `Navbar.astro:52-85` (post-004), terse procedural style, comments
  only where a decision is non-obvious.
- The disabled state relies on no new CSS: a disabled button attribute is
  enough (cursor is `not-allowed` by UA+`button:not(:disabled)` rule's
  complement in `src/styles/global.css:72`).
- No new tokens, no `prefers-reduced-motion` additions — this is a state
  label swap, not motion.

## Steps

1. Replace the whole `<script define:vars=…> … </script>` block in
   `src/components/QuoteForm.astro` (currently lines 81–96) with the block
   from the **Target** section, verbatim.
2. Touch nothing else in the file — the markup, the submit button, the email
   anchor are all unchanged.

## Boundaries

- Do NOT touch `index.astro` (its `<script>` links the product-card flow and
  is out of scope), the submit button markup, or any CSS.
- Do NOT add an `aria-live` region, a popup-blocked notice, an error path,
  or haptics/vibration.
- Do NOT change the WhatsApp URL construction, the message lines, or the
  form validation (`required` attributes).
- Do NOT change the 2500ms constant, and do not replace the timer with a
  `transitionend` dependency.
- If the current script block differs from the excerpt above (drift), STOP
  and report instead of improvising.

## Verification

- **Mechanical**: `npm run build` passes; the built homepage HTML contains
  the inline script strings `Membuka WhatsApp` and `2500` (the script stays
  inline because of `define:vars` — search `dist/index.html`).
- **Feel check** (`npm run dev`, DevTools device mode set to a phone):
  - Submit with all fields filled: WhatsApp tab starts opening AND the
    button label reads `Membuka WhatsApp…` immediately; the WhatsApp icon
    disappears during this state (expected, per design) and the button
    returns icon+「Kirim via WhatsApp」exactly after 2.5s.
  - During the 2.5s state, click the disabled button: nothing happens.
  - During the 2.5s state, press **Enter** inside a text field: nothing
    happens (the `busy` guard — verify by re-checking only one WhatsApp tab
    opened; this is the actual bug fix).
  - After 2.5s: submit again — works fresh.
  - Blocked-popup sanity (Chrome: temporarily disable
    `allow-popups`… easiest: DevTools → Settings → Debugger up to you; skip
    if awkward): with popups blocked the label must NOT change and the
    button must stay enabled.
- **Reduced motion**: nothing to check (no motion added) — the label state
  applies instantly as intended.
- **Done when**: one submit → one WhatsApp tab, immediate label feedback for
  exactly 2.5s, Enter-spam produces at most one tab, blocked popups never
  show a lying state, build passes.

## Notes for the reviewer

- The 2.5s number is the one knob and it's a guess-by-design (we can't click
  a real phone in CI). If field-testing shows the WhatsApp app hand-off on
  typical Indonesian devices takes longer, raise to 3000–4000ms — nothing
  else may change.
