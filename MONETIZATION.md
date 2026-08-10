# Cosign Monetization Plan

Updated: August 7, 2026

## Executive decision

Cosign should monetize shopping intent without selling ranking priority or personal data.

The recommended stack is:

1. **Sovrn Commerce for the affiliate MVP.** It supports publisher links, link and reporting APIs, merchant optimization, and broad merchant coverage.
2. **Skimlinks as a later coverage layer.** Apply after the site has original editorial content and consistent traffic.
3. **Direct retailer programs for the top merchants.** Begin after click and conversion data identify the retailers worth managing individually.
4. **ShopMy or Mavely for Tyler's social storefronts.** Use these for social distribution, not as the application’s core link infrastructure.
5. **Premium tools and sponsored editorial as the second revenue engine.** Affiliate revenue should not be the only business model.

The site must always disclose affiliate relationships close to shopping actions. Editorial ranking, compatibility scores, and celebrity attribution must never be determined by commission rate.

## What is already implemented

Every catalogue Buy link now resolves through:

```text
/go/:productId
```

The Cloudflare Pages Function:

- validates the product ID against the Cosign catalogue;
- rejects unsupported destinations;
- keeps the affiliate credential out of the React bundle;
- redirects through Sovrn when `SOVRN_KEY` is configured;
- sends users to the original retailer when no key is configured;
- supports a sanitized placement value for future attribution;
- avoids setting affiliate cookies before an intentional click.

Implementation files:

- `src/lib/affiliate.ts`
- `functions/go/[product].js`

## Required founder setup

### 1. Apply to Sovrn Commerce

Create a publisher account and submit the production website:

```text
https://cosign.pages.dev
```

Sovrn says campaigns may need implemented links and real clicks before review. Keep the fallback redirect active while approval is pending.

### 2. Configure the secret in Cloudflare

After Sovrn provides a Commerce key, store it as a Cloudflare Pages environment variable named:

```text
SOVRN_KEY
```

Set it for Production and Preview if previews need attribution testing. Never paste the key into React, GitHub, screenshots, documentation, or chat.

### 3. Verify attribution

Test one product from each important merchant:

1. Open the product drawer.
2. Copy the retailer destination.
3. Click Buy.
4. Confirm `/go/:productId` returns a `302`.
5. Confirm the final retailer product page is correct.
6. Confirm the click appears in the affiliate dashboard after its normal reporting delay.
7. Record merchants that do not monetize and preserve their original links.

Do not assume a wrapped link earns commission. Merchant participation and program terms can change.

## Affiliate disclosure

Place this directly above or beside shopping actions:

> Cosign may earn a commission when you shop through our links, at no extra cost to you. Commission never changes your match score or our editorial ranking.

Use this short label on compact product surfaces:

```text
Affiliate link
```

Use this at the beginning of social captions containing tracked links:

> Affiliate links — Cosign may earn a commission from purchases.

An About page or footer disclosure alone is not sufficient. The FTC expects material relationships to be clear, conspicuous, and close to the recommendation.

## Celebrity-content policy

Celebrity fit coverage is commercially valuable and legally sensitive.

### Allowed sources

- photography commissioned or owned by Cosign;
- photography licensed for the intended commercial/editorial use;
- written permission from the photographer or rights holder;
- media supplied by a brand, stylist, athlete, artist, or agency with permission to republish;
- official platform embeds used under the platform’s current rules;
- user submissions governed by explicit upload and licensing terms;
- product-only recreations built from authorized retailer imagery.

### Not allowed by default

- downloading and re-uploading an Instagram, TikTok, ESPN, Getty, newsletter, or photographer image;
- assuming a public account creates a commercial reuse license;
- treating photographer credit as permission;
- removing watermarks;
- implying that a celebrity endorses Cosign;
- using a celebrity’s face in an advertisement without appropriate rights;
- calling an alternative product the exact piece.

Every celebrity-fit record should store:

```text
source_url
source_type
rights_status
photographer
captured_at
identification_confidence
identification_evidence
reviewed_by
```

Use these identification levels:

1. **Exact match** — directly tagged, credited, confirmed by a stylist/brand, or visually conclusive.
2. **Strongly identified** — distinctive details align and credible sources support the identification.
3. **Similar alternative** — resembles the silhouette, material, and color but is not presented as the original.
4. **Style-inspired** — captures the outfit direction without claiming product equivalence.
5. **Community identification** — unverified and visibly labeled pending review.

## Revenue model

Affiliate revenue should be modeled from buyers, not total registered users.

```text
monthly affiliate revenue =
monthly active users
× shopping sessions per user
× outbound click rate
× retailer conversion rate
× average order value
× effective commission rate
× retained commission after returns
```

Illustrative base assumptions—not promised network performance:

```text
shopping sessions per user:      1.5
outbound click rate:             18%
retailer conversion rate:        2.5%
average order value:             $120
effective commission:            7%
commission retained after returns: 85%
```

At 100,000 monthly active users, those assumptions produce approximately 675 orders, $81,000 in referred sales, and $4,820 in affiliate revenue. If 100,000 users each actually buy $120, referred sales would be $12 million and a 7% gross commission would be $840,000 before returns and reversals. These are radically different scenarios.

Track three forecasts:

| Scenario | Buyer rate | Effective commission | Return/reversal allowance |
|---|---:|---:|---:|
| Conservative | 1% | 3% | 20% |
| Base | 3% | 7% | 15% |
| Aggressive | 10% | 10% | 12% |

Replace assumptions with observed data as soon as conversion reporting is reliable.

## Ninety-day launch plan

### Days 1–14: compliance and measurement

- Apply to Sovrn Commerce.
- Publish Affiliate Disclosure, Editorial Policy, Privacy, Terms, Contact, and Content Takedown pages.
- Add the compact disclosure beside Buy actions.
- Configure Cloudflare analytics or a privacy-conscious product analytics provider.
- Establish events for product views, Buy clicks, retailer exits, saves, and fit-page engagement.
- Audit the rights status of every celebrity image.
- Remove or replace media with unclear rights.

Exit condition: every shopping link has a safe fallback and every published celebrity asset has a recorded rights status.

### Days 15–30: affiliate MVP

- Add `SOVRN_KEY` to Cloudflare after approval.
- Test the top 25 merchants manually.
- Add placement parameters for product drawer, fit page, wardrobe gap, saved collection, and search.
- Create a merchant coverage report.
- Monitor broken destinations and unexpected redirects.
- Build ten high-intent pages such as “best campus jackets under $200.”

Exit condition: tracked clicks appear in reporting and at least 90% of tested Buy links land on the correct product or a clearly labeled alternative.

### Days 31–60: content and distribution

- Publish three to five original fit breakdowns per week.
- Produce exact-match and affordable-alternative versions.
- Create short-form TikTok, Reels, and YouTube Shorts edits from owned or licensed media.
- Route social users to a dedicated fit page instead of a generic homepage.
- Create ShopMy or Mavely collections for social experiments.
- Test daily Fit Drop notifications and newsletter modules.

Exit condition: identify the five content formats and five merchants with the highest earnings per thousand sessions.

### Days 61–90: optimization and direct programs

- Apply to Skimlinks if traffic and original-content requirements are met.
- Apply directly to the ten merchants generating the most qualified clicks.
- Negotiate exclusive codes with independent brands.
- Add price and stock freshness indicators only when data rights permit.
- Test a premium wardrobe tier.
- Prepare a sponsored Fit Drop product with strict labeling and editorial separation.

Exit condition: one repeatable acquisition channel and one monetization channel show positive unit economics.

## Recommended product tiers

### Free

- discovery and catalogue search;
- celebrity fit breakdowns;
- saving and basic collections;
- basic wardrobe;
- affiliate-supported shopping links.

### Cosign Plus: test $6.99–$9.99 monthly

- unlimited wardrobe items;
- advanced outfit generation;
- fit planning by weather and occasion;
- size and silhouette intelligence;
- price-drop and restock alerts;
- annual taste recap;
- deeper compatibility explanations;
- exportable closet and packing lists.

Do not remove core trust or basic recommendations from the free tier just to force conversion.

## Sponsored commerce rules

Sponsored products must:

- be labeled `Sponsored` before interaction;
- remain separate from compatibility and editorial scores;
- never receive a fabricated celebrity cosign;
- satisfy the same product quality and destination checks as organic products;
- include campaign start and end dates;
- be excluded automatically when unavailable;
- be reported separately from affiliate revenue.

Sell packages around editorial production, not hidden ranking boosts:

- sponsored Fit Drop;
- campus ambassador activation;
- newsletter placement;
- licensed lookbook integration;
- brand challenge or community collection;
- aggregate, privacy-safe trend report.

## Metrics dashboard

### Acquisition

- new users by source;
- cost per acquired user;
- social post to site click rate;
- landing-page activation rate.

### Engagement

- fit pages viewed per session;
- product saves per user;
- wardrobe activation rate;
- seven-day and thirty-day retention;
- search-to-product-open rate.

### Commerce

- outbound click-through rate;
- monetized-click coverage;
- merchant conversion rate;
- average order value;
- effective commission rate;
- revenue per click;
- earnings per thousand sessions;
- reversal and return rate;
- broken-product rate.

### Trust

- disclosure visibility rate;
- product-identification corrections;
- content takedown requests;
- sponsored-content hide/report rate;
- recommendation satisfaction feedback.

## Technical backlog

### P0

- [x] Route catalogue Buy links through a server-side product-ID redirect.
- [x] Keep the affiliate credential out of the React application.
- [x] Preserve normal retailer links when no affiliate credential exists.
- [ ] Add affiliate disclosure beside every Buy action.
- [ ] Configure `SOVRN_KEY` after approval.
- [ ] Verify top merchants and document coverage.
- [ ] Add legal and editorial policy pages.
- [ ] Audit image rights.

### P1

- [ ] Add explicit placement parameters to Buy links.
- [ ] Store click events with product, merchant, fit, celebrity, placement, and timestamp.
- [ ] Import network conversion reports.
- [ ] Build merchant and revenue dashboards.
- [ ] Add broken-link and product-availability monitoring.
- [ ] Add exact-match versus alternative labels to every fit piece.

### P2

- [ ] Add a network-routing table for direct, Sovrn, Skimlinks, and standard links.
- [ ] Add retailer alternatives and price comparisons where program terms permit.
- [ ] Add subscription billing after premium demand is validated.
- [ ] Add sponsored Fit Drop inventory and campaign reporting.
- [ ] Add privacy-safe aggregate trend reporting.

## Network strategy

Never pass a click through multiple affiliate wrappers. Assign one preferred route per merchant:

```text
direct program → preferred when economics and terms justify management
Sovrn          → broad launch coverage
Skimlinks      → later fallback coverage
standard URL   → when no approved monetization route exists
```

Evaluate routes using realized earnings per click after reversals, not advertised commission alone.

## Application description

Use this when applying to publisher networks:

> Cosign is a fashion discovery and wardrobe platform for Gen Z consumers. We publish original editorial outfit breakdowns, identify products worn by athletes and artists using documented sources, and provide clearly labeled exact matches and affordable alternatives. Users can search a curated multi-brand catalogue, save products, build a digital wardrobe, and visit retailers through intentional shopping links. We do not use cookie stuffing, trademark bidding, misleading product claims, or undisclosed paid placement. Affiliate relationships are clearly disclosed and do not influence personalized match scores or editorial rankings.

## Direct-brand pitch

> Cosign helps high-intent young shoppers understand how a product fits into a complete wardrobe—not just see it in a feed. We would like to feature your products in documented fit breakdowns, personalized recommendations, and campus-focused editorial collections. We can track qualified outbound traffic using campaign IDs or an exclusive code while keeping sponsored status clearly disclosed. We are looking for accurate product feeds, reliable deep links, an exclusive shopper code where possible, and a commission structure tied to completed sales.

## Authoritative references

- [Sovrn Commerce](https://www.sovrn.com/commerce/)
- [Sovrn Commerce link API](https://developer.sovrn.com/reference/building-affiliate-links)
- [Sovrn API onboarding](https://knowledge.sovrn.com/kb/api-onboarding-guide-for-commerce)
- [Sovrn publisher code of conduct](https://www.sovrn.com/service-policies/commerce-publisher-code-of-conduct/)
- [Skimlinks publisher suitability](https://support.skimlinks.com/hc/en-us/articles/223835528-How-do-I-know-if-my-site-app-or-social-media-channel-is-suitable-for-Skimlinks)
- [Skimlinks program policies](https://www.skimlinks.com/program-policies/)
- [Mavely creator FAQ](https://mavely.zendesk.com/hc/en-us/articles/33492851424023-FAQ-Your-Guide-to-Affiliate-Success)
- [Mavely compliance requirements](https://mavely.zendesk.com/hc/en-us/articles/31984524277399-Ensuring-Your-Account-is-Compliant)
- [ShopMy creators](https://shopmy.us/home/creators)
- [FTC Endorsement Guides FAQ](https://consumer.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)
- [FTC Disclosures 101](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers)
- [Instagram Terms of Use](https://www.facebook.com/help/instagram/581066165581870)

This document is an operating plan, not legal or tax advice. Have counsel review celebrity licensing, publicity rights, platform terms, privacy practices, and sponsored-content contracts before commercial launch.
