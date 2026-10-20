# Galamed: Launch Checklist (Level 5)

Account: refaariaramdhani@gmail.com, use this Gmail for ALL steps below.

## 1. Deploy (do first, Google can't index localhost)

- [ ] Push `D:\Programming\galamed` to GitHub
- [ ] Import repo in Netlify (or Vercel) → build command `npm run build` → publish dir `dist`
- [ ] Add custom domain `galamed.id` in Netlify/Vercel → copy the DNS values
- [ ] At your domain registrar, set the A / CNAME records → wait until `https://galamed.id` loads
- [ ] Confirm `https://galamed.id/robots.txt` and `https://galamed.id/sitemap.xml` both load

## 2. Google Search Console: "am I on Google?" (5 min)

- [ ] Go to https://search.google.com/search-console → Sign in with refaariaramdhani@gmail.com
- [ ] Add property → Domain → enter `galamed.id` → verify via DNS TXT record
- [ ] Sitemaps (left menu) → add `sitemap.xml` → Submit → status should turn Success
- [ ] Day 1–7 proof: Google `site:galamed.id`, your homepage must appear
- [ ] Week 2+: Performance tab → see real queries (e.g. `kasa steril distributor`)

## 3. GA4: "what do visitors do?" (10 min, optional for launch)

- [ ] https://analytics.google.com → same Gmail → Create property `Galamed`
- [ ] Data Streams → Web → `https://galamed.id` → copy Measurement ID `G-XXXXXXXX`
- [ ] In `src/layouts/BaseLayout.astro`, replace `G-XXXXXXX` (2 spots) and uncomment the script
- [ ] Rebuild + redeploy → Realtime report → open your site → you appear within 30s

## 4. Verification code wiring (only if Search Console gives you an HTML tag)

- [ ] Search Console → Settings → Verification → HTML tag → copy the `content="..."` value
- [ ] In `src/layouts/BaseLayout.astro`, uncomment the `google-site-verification` meta and paste the code
- [ ] Redeploy

## 5. Google Business Profile: highest ROI for RS buyers (15 min)

- [ ] https://business.google.com → same Gmail → add `PT Galunggung Perkasa Husada`
- [ ] Category: Medical Supply / Alat Kesehatan; add WA +62 823-1582-2926, email refa@galamed.id
- [ ] Add logo + 3 product photos; ask 3 RS clients for reviews

## 6. Post-launch (Phase 2 backlog, NOT now)

- [ ] Decap CMS (`/admin`) for the non-tech editor (1×/week product + image edits)
- [ ] 3 starter articles (kasa steril guide, SOP antiseptik, checklist pengadaan)
- [ ] Real product photos replace `/legacy/sterile.webp` placeholders

Done = `site:galamed.id` shows up + 1 WA inquiry tracked. That's launch. 🚀
