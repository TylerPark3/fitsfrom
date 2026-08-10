# Cosign — design foundation

Written after two days of building without one, which is why the same decisions
kept getting relitigated. Every design choice from here checks against this
document. If a change can't be justified against it, the document is wrong and
should be changed first — deliberately, not by drift.

---

## What it is

**Instagram discovers the fit. Cosign explains it.**

The post is the input. The product is everything around it: who wore it, what
it is, why it works, where to get it, what size you need, what you already own,
and how to make it yours.

## Who it's for

Someone who has typed *"where can I get that jacket"* into a comment section
and never got an answer.

Not a fashion insider — they already know. Not a general shopper — they don't
care. The person in the middle: culturally fluent, knows who SGA and Carti are,
has opinions, but doesn't know that the reason the fit works is where the hem
lands.

## What leads

**A publication.** Not a tool, not a shop.

The site reads like a magazine that happens to be shoppable. Type and
photography lead. The instrument — sizing, match scores, the styling engine —
is real and it is the reason to pay, but it defers to the editorial. The shop
is the last thing you meet, never the first.

Concretely, this means:

- The read comes before the price
- A section header is a **line of type and a rule**, never a card
- Product grids are quiet; the fit above them is loud
- Nothing gets a shadow, a gradient or a rounded box to make it "pop"
- If a screen looks like a dashboard, it's wrong

## What it should feel like

**"This is for me."**

Recognition, not admiration. Someone should land and see their own references
looking back — the names they know, the moments they watched live, the
arguments they've had. Cultural specificity beats polish. A real date, a real
arena, a real stylist's name is worth more than another gradient.

The failure mode to avoid: a beautiful site that could be about anything.
Cosign should be legible as being about *this*, from three seconds in.

---

## Type

Three families, each with one job. The serif is what stops it reading as a SaaS
dashboard — it is the editorial signal and it does not get removed.

| Role | Family | Used for |
|---|---|---|
| Display / body | **Manrope** / Archivo | Headlines, names, body copy |
| Editorial | **Instrument Serif** | The headline of a read, a pull quote, one word in a hero |
| Data | **IBM Plex Mono** | Labels, eyebrows, dates, counts, confidence, prices in tables |

Rules:

- The serif appears **once per screen**, at most twice. It's punctuation, not a
  voice.
- Mono is always uppercase, always small, always letterspaced. It is the sound
  of the machine talking — measurements, timestamps, confidence.
- Body copy never exceeds ~62ch.

## Colour

Two neutrals and one accent, and the accent is **withheld**.

```
--paper  #ffffff   the page
--ink    #121915   type
--line   #e9e7e1   every rule and edge
--red    #9a3f2c   one thing per screen, maximum
```

The clothes are the colour. Everything else is paper, ink and a hairline. Red
is for live state and genuine warning — never for decoration, never on more
than one element at a time.

## Space and edge

- Rules, not boxes. A 1px line does what a card does, without the weight.
- `border-radius` maxes at 4px on containers, 3px on images. Nothing is a pill
  except a genuine chip.
- No shadows on content. Shadows are for things that float — drawers, sheets.
- Sections breathe at 88px; the feed at 104px. When in doubt, more air.

## Motion

Motion confirms, it doesn't perform.

- 140ms for state, 260ms for entrances, nothing longer.
- Nothing animates on scroll. Nothing parallaxes.
- `prefers-reduced-motion` turns all of it off, everywhere.

## Sound

An 808 sub for every interaction, a dry mechanical tick for the fit check.
Under 50ms, sub-90Hz, and muteable. It's a signature, not a feature — if it
ever draws attention to itself it's too loud.

---

## The honesty rules

These are design constraints as much as editorial ones, because they show up on
screen:

1. **Never claim certainty we don't have.** Every identified piece carries a
   confidence label. `pending` renders no product and no price.
2. **Community guesses are labelled as guesses**, always, in the accent colour
   reserved for warnings.
3. **We don't host other people's photographs.** Embeds keep the image on the
   platform that owns it, with attribution intact.
4. **The read describes the post it sits next to.** If the URL changes, the
   words change with it.

---

## Reference library

What each reference is actually *for* — not "this looks good."

| Reference | What to take | What to leave |
|---|---|---|
| **Aimé Leon Doré** | The cover: one image owns the screen, tiny centred type, no chrome until you ask | Their palette; we're colder |
| **The Ringer** | Opinionated writing as the product. A take, not a description | Their density |
| **SSENSE** | Product grids that stay quiet. Mono labels, no cards | Their coldness — we want recognition, not distance |
| **Billionaire Boys Club** | One simple geometric mark, single colour | The logo-as-decoration |
| **flysoar.ai** | Elite white, restraint, confidence in whitespace | It's a SaaS site; we're a publication |

**Competitor screens are a feature list, not a reference.** ProTrending,
LeagueFits, NFL Style and Fashion Fits tell us what to beat. They do not tell
us what to look like, and copying their structure is how a product ends up with
a bit of everyone's design and none of its own.

---

## Open

- **The mark.** Wordmark only until one is designed. Safest place for it.
- **Should the Tunnel be the home page?** Tried it, reverted it.

  The reasoning was sound — if a publication leads, the front page should be
  the publication. In practice the landing has a different job from the feed:
  it has to tell someone who has never heard of Cosign what this is, and a feed
  can't do that in three seconds. The Tunnel gets one featured post on the
  front page and lives on its own.

  Worth recording rather than deleting: "publication leads" is about tone and
  hierarchy, not about literally putting the feed first.
