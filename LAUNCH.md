# Launch checklist

Ordered by what actually hurts if it's missing on the day.

---

## 1. Share image — DONE

`og:image` was `/fits/sga-arrival.jpg`, an agency photograph of an NBA player.
Reddit, Twitter, iMessage and Discord each copy that file onto **their own**
servers when a link is shared, so it was the single most-replicated asset on the
site and the one most likely to be found by a reverse-image crawler.

Replaced with `/share/og.png` — a typographic card we own outright. Regenerate it
by editing the Pillow block in git history, or just replace the PNG at
1200×630.

---

## 2. The 56 hosted photographs — NEEDS YOU

| Directory | Count | Plan |
|---|---|---|
| `public/fits` | 28 | Replace with Instagram embeds. The `ig` field already exists on `Fit` and `InstagramFitEmbed` already renders it. **Send the official post URL for each fit you want to keep.** |
| `public/room` | 27 | Decoration, not product. Either license, replace with embeds, or cut — the interest picker can fall back to type. |
| `public/editorial` | 2 | Cut. |

Anything without a findable official post gets removed. A smaller site beats a
demand letter.

**Why an embed is different from a hosted file:** the photograph is served by
Instagram, the photographer's attribution travels with it, and the post links
home. Nothing is copied onto our servers. That is the mechanism publications
use, and it is not a loophole.

---

## 3. Analytics — SNIPPET IN, NEEDS TOKEN

Cloudflare Web Analytics: free, cookieless, no consent banner, already on the
same platform.

1. dash.cloudflare.com → Analytics → Web Analytics → Add a site
2. Enter `fitsfrom.pages.dev`
3. Copy the token into `data-cf-beacon` in `index.html` (replace `TOKEN`)

Or enable it from the Pages project settings and Cloudflare injects the beacon
for you — in which case delete the block from `index.html`.

What it answers on launch day: which subreddit converts, where onboarding is
abandoned, whether anyone reaches the Tunnel.

---

## 4. Domain — NEEDS YOU

Buy `fitsfrom.com` through **Cloudflare Registrar** (at cost, roughly $10/yr,
DNS wired automatically), then Pages → Custom domains → Add. TLS provisions
itself.

Do this **before** posting anywhere. A `.pages.dev` link reads as a prototype,
and the URL can't be changed once people have shared it.

Afterwards, update the absolute URLs in `index.html` (`og:url`, `og:image`,
`twitter:image`) to the new domain.

---

## 5. Affiliate key — NEEDS YOU, CURRENTLY MISSING

`npx wrangler pages secret list --project-name=fitsfrom` returns empty, so
`SOVRN_KEY` is not set and **every outbound click currently earns nothing**.

1. Sign up at sovrn.com/commerce
2. `npx wrangler pages secret put SOVRN_KEY --project-name=fitsfrom`

`/go/:productId` degrades gracefully without it — the redirect still works, the
commission just isn't attributed. With 2,046 products and a traffic spike
coming, this is the difference between launch traffic being worth something and
worth nothing.

---

## 6. Accounts and sync — AFTER LAUNCH IS FINE

Today a closet lives in one browser. Reddit traffic is mostly mobile: someone
completes onboarding on a phone, opens a laptop, and it's gone.

Order of work:
1. Supabase project (free tier)
2. Email magic-link auth
3. Mirror `AppState` to a `profiles` row; keep localStorage as the offline cache
4. Swap `socialRepository` for a Supabase implementation — it is already an
   interface, so no component changes
5. Same for `searchLog` in `lib/heat.ts`, which turns the Heat board from
   per-device into real cross-user demand

**Ship the launch on localStorage.** Add one line saying saves live on this
device. It's honest, and it makes accounts land as an upgrade rather than a fix.

---

## Do not take payments yet

The $19.99 gate is presentational — the analysis text ships inside the JS
bundle, so anyone can read it in devtools and the entitlement is a localStorage
flag. Keep the waitlist button, collect emails. A waitlist is a stronger launch
signal than a handful of payments you can't yet enforce or refund.

Before charging: server-verified Stripe subscription, webhook reconciliation,
and premium content served from an authenticated endpoint rather than the
bundle.

---

## Posting plan

**Do not post to** r/malefashionadvice, r/streetwear or r/frugalmalefashion.
All three have hard self-promotion bans; you get removed and usually banned, and
you only get one shot per account.

**Launch on:** r/SideProject, r/InternetIsBeautiful, r/webdev showcase threads,
r/Entrepreneur.

**Then earn the fashion subs** by answering "what jacket is this?" threads with
a real identification *and* a link to the breakdown. That is the product's exact
use case, so it reads as contribution rather than spam.

**Lead with:** Pinterest shows you the fit and never tells you what it is.
Not with the subscription.
