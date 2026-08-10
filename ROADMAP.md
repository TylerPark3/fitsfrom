# Cosign — Roadmap

Live: **cosign.pages.dev** · Repo: `Desktop/Fashion` · Everything below is ordered by "do this next."

---

## 0 · This week (launch blockers)

- [ ] **Buy cosign.com** (~$9/yr, Cloudflare registrar → wires straight to the Pages project). It was available Aug 6 — this can vanish any day.
- [ ] **`gh auth login`** → push repo to `TylerPark3/cosign`. Right now the only copy of this code is on this laptop.
- [ ] **Photo rights.** Tunnel photos are agency-owned (Getty/AP). Before promoting publicly: collect the players' own Instagram post URLs for each fit, paste into the `ig` field in `src/data/fits.ts` — the site already renders real IG embeds (licensed via Instagram's ToS). Keep local JPGs only for fits where the person posted it themselves.
- [ ] **Sovrn key** — sign up at sovrn.com/commerce (free, 5 min), paste key into `src/lib/affiliate.ts`. Every Buy link starts earning ~5–15% immediately.
- [ ] **OG / social cards** — add `og:image` (a fit collage), `og:title`, `twitter:card` to `index.html` so links look right when shared on Reddit/IG/Discord.
- [ ] **Mobile pass** — walk every screen at 375px width; fix anything cramped. Most traffic will be phones.
- [ ] **Refresh the catalog** before launch day: `node scripts/fetch-feeds.mjs feeds.json && node scripts/curate.mjs feeds.json` then rebuild + deploy. Prices/stock drift weekly.

## 1 · Content engine (the actual growth loop)

- [ ] **3 fit files per week minimum.** Each new fit = one photo + ~20 lines in `fits.ts`. This is the product.
- [ ] **IG carousel template**: slide 1 photo → slides 2–6 one piece each (price + "your size" framing) → last slide "full file in bio." 15 min/post from existing site data.
- [ ] **Pinterest**: pin every fit photo linking to the site. Compounds in Google Images for "[player] outfit" searches for years.
- [ ] **Reddit**: answer "where'd he get this" posts in r/malefashionadvice, r/streetwear, r/OUTFITS, r/findfashion genuinely; link only after karma. 5 clean answers per 1 link.
- [ ] **Expand lanes**: NFL tunnel walks, musicians (Drake/Bieber/V already prove the format), actors (Chalamet was the original idea). Each lane = new audience, same data file.
- [ ] Fit of the day already rotates automatically — reference it in captions ("today's file").

## 2 · Backend (unlocks real social — do when traffic exists)

Everything is localStorage today. Supabase (free tier) turns on, in order of value:

- [ ] **Real accounts** — swap AuthView's local SHA-256 for Supabase auth (Apple/Google buttons become real).
- [ ] **Live rooms** — reactions + takes sync across users (Supabase Realtime). The UI is already built; only the storage layer changes.
- [ ] **Server-side unlocks** — the 3-free-breakdowns quota currently lives client-side and is trivially resettable; fine for now, must move server-side before it matters.
- [ ] **Cross-device wardrobe/saves** — the retention feature.
- [ ] **Waitlist/email capture** as an intermediate step if full backend feels heavy.

## 3 · Product features (ranked by effort-to-impact)

- [ ] **Scan your fit (AI)** — photo of today's outfit → Claude vision API identifies pieces → matches catalog + icon similarity score. This is the "best of technology" differentiator vs Pinterest; needs a tiny serverless function to hold the API key (Cloudflare Worker, ~50 lines).
- [ ] **AI try-on (THE paid feature)** — tap a piece in a fit file → render it onto your own snap (image-edit model). Free tier: browse + 3 unlocks/day. Pro ($5/mo via Stripe Payment Link): try-on, unlimited unlocks, unlimited wardrobe/saves. Do NOT charge before the backend exists — a client-side paywall is bypassable in DevTools.
- [ ] **Face scan profile** — Face-ID-style scan animation for the profile avatar; real value only once try-on exists (face consistency in renders).
- [ ] **Quick-add parser v2** — brand autocomplete from the catalog's 24 brands, size validation, category confirm chip instead of silent guess.
- [ ] **Per-fit share pages** — `/fit/poole-arrival` URLs with prerendered OG images so each breakdown is shareable/rankable. Needs prerendering (vite-plugin or migrate to Astro later). Big SEO unlock: "jordan poole outfit" searches land on you.
- [ ] **Style twin v2** — show the twin reveal as a shareable card at end of onboarding (the Spotify-Wrapped moment; screenshot-bait for IG stories).
- [ ] **Search across fits** — one input over people/pieces/brands (Discover search exists; extend to fits).
- [ ] **Icon affinity on Avatar page** — top-3 icons with % and shared tags (lib already computes this via `styleTwins`).
- [ ] **More granular sizing** — sleeve length, rise preference; brand-specific fit notes crowdsourced from the rooms.

## 4 · Revenue (in order)

1. **Affiliate links** — wired, dormant until Sovrn key. Track outbound clicks once analytics exist.
2. **Brand placement** — once fits get traffic: a niche brand pays to be the "worn" match in a file (clearly labeled). $500–2k/mo per slot is standard for this audience size class.
3. **Pro tier ($5/mo) later** — AI try-on, unlimited unlocks, unlimited wardrobe. Stripe Payment Link (no code needed) once the backend can enforce it. Free-first: get them enthralled, charge for the magic, never paywall the culture content.
4. **Attribution, answered** — you never have to "prove" a sale to a brand: the affiliate network (Sovrn) wraps your links, the click sets a cookie at the brand's checkout, the network reports and pays automatically (~30-day window, 5–15%). Once volume exists, go direct to small brands with a code ("FITSFROM10") — codes are self-proving and usually pay better (15–20%).

## 5 · Tech debt / hygiene

- [ ] **Catalog auto-refresh** — GitHub Action running the two scripts weekly + auto-deploy (needs the repo pushed first).
- [ ] **Product images hotlink Shopify CDNs** — fine at small scale; mirror top images to your own bucket before real traffic.
- [ ] **Analytics** — Cloudflare Web Analytics (free, no cookies, honest with the FAQ's privacy claims). Watch: fit opens, unlock consumption, outbound clicks, account creations.
- [ ] **Error tracking** — Sentry free tier, or at minimum a window.onerror beacon.
- [ ] **localStorage quota** — photos are downscaled but many custom closet pieces could hit 5MB; add a usage meter or IndexedDB migration.
- [ ] **Affiliate disclosure page** — required by FTC once Sovrn is live; one paragraph in the FAQ.
- [ ] **prefers-reduced-motion** already respected; keep it that way with new animations.

## 6 · Positioning (one paragraph, don't lose it)

Pinterest's "Shop the Pin" answers "shorts?" with a $12 SHEIN lookalike. **Cosign answers with the actual piece, in your size, from the real store, inside the culture that made you want it.** Wardrobe apps (Whering/Alta/Indyx) have the closet tech but no culture and no young-men wedge; LeagueFits has the culture but sells nothing. The moat is speed + taste + the fit-file archive compounding in search.

---

*Update this file as things ship. The habit that matters most: 3 fit files a week, every week.*
