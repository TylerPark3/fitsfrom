
const SECTIONS: { id: string; title: string; sub: string; qa: [string, string][] }[] = [
  {
    id: 'how',
    title: 'How it works',
    sub: 'All you need to know.',
    qa: [
      [
        'What is this?',
        'Iconic fits — tunnel walks, courtside, street — broken down piece by piece, plus a catalog of niche brands ranked against your size, budget and taste. Every piece links straight to the brand’s own store.',
      ],
      [
        'Do you sell the clothes?',
        'No. Every Buy button opens the brand’s own site in a new tab. We never touch your card, shipping or returns — the brand handles all of it.',
      ],
      [
        'Are the prices real?',
        'Yes — products, prices and images come from each brand’s live store feed. Nike, adidas, New Balance and On don’t publish a feed of their own, so those come from authorized stockists that do; the price and link are still the retailer’s real ones. Stock moves fast, so always confirm at checkout.',
      ],
      [
        'What does it cost?',
        'Nothing. Some outbound links may earn us a small commission at no extra cost to you — it never changes what we show or rank.',
      ],
    ],
  },
  {
    id: 'fits',
    title: 'Fits & rooms',
    sub: 'The culture side.',
    qa: [
      [
        'Where do the fit photos come from?',
        'Curated from documented public appearances. We aim to use owned, licensed, permissioned, officially embedded, or authorized media; credit alone is not treated as permission. Rights holders can request a review or takedown from our policy page.',
      ],
      [
        'What is the fit of the day?',
        'One fit, same for everyone, rotates automatically every 24 hours. Come back tomorrow.',
      ],
      [
        'What is “the room”?',
        'Reactions and takes under every fit. Right now it runs on your device as a preview — real-time rooms across all users launch with accounts.',
      ],
      [
        'What is a style twin?',
        'When you pick your styles, we match you to the player whose fits share your taste. It’s computed from style overlap — updated the moment your taste changes.',
      ],
    ],
  },
  {
    id: 'wardrobe',
    title: 'Wardrobe & the dressing room',
    sub: 'Your closet, and the figure that wears it.',
    qa: [
      [
        'What is the dressing room?',
        'Your build standing in the middle of your closet. Pick a top, a bottom, shoes, a hat and an accessory off the rails beside it and they go on the figure — placed against your body’s own landmarks, so a collar lands at your neck rather than floating over your face. What it’s wearing saves to this device.',
      ],
      [
        'Why can’t I put some pieces on the figure?',
        'Some brands photograph a piece on a model instead of flat on white. Pasting one of those onto your build would put a second person on your body, so only flat product shots reach the rails. Those pieces are still in your closet — they just can’t be worn on the mannequin.',
      ],
      [
        'How is my closet worth calculated?',
        'Retail price, discounted by condition (NWT down to Beat) and by how long you’ve owned it. Both are set when you add a piece and can be changed any time from the closet shelf.',
      ],
      [
        'Why are there only two shelves?',
        'Tops and Bottoms. Everything finer — shirts, knits, outerwear, shorts, shoes, accessories — is a filter inside those two rather than another row to scroll past.',
      ],
      [
        'What does the diamond on a card mean?',
        'A match of 90% or higher. Rare on purpose — it earns the shine and the ◆ 90%+ MATCH tag.',
      ],
      [
        'What does the thumbs-down do?',
        'Tells the ranker to stop showing you that lane. One press pushes the score away from that brand, style and colour straight away, and pulls the piece out of your saves. Press it again to undo.',
      ],
    ],
  },
  {
    id: 'sizing',
    title: 'Sizing & avatar',
    sub: 'Why every card shows your size.',
    qa: [
      [
        'How does size recommendation work?',
        'Your height and weight seed an estimate; chest, waist, inseam and shoe sharpen it. Each product then maps your measurements to its size system — including brands that run big or small. One-size pieces like belts and caps always pass the size filter, because they fit everyone.',
      ],
      [
        'Is the photo I upload private?',
        'Completely. It’s stored in your browser’s local storage and never uploaded anywhere. It’s used to read your proportions — the figure in the dressing room is always your build, never your photograph. Remove it any time from the Avatar tab.',
      ],
      [
        'Do I need a tape measure?',
        'No — height and weight get you a solid estimate. Two minutes with a tape measure makes the recommendations noticeably sharper.',
      ],
    ],
  },
  {
    id: 'account',
    title: 'Account & privacy',
    sub: 'What we know about you: nothing.',
    qa: [
      [
        'Where does my account live?',
        'On this device. Your profile, wardrobe, saves and takes are stored locally — there is no server yet. Synced accounts are the next milestone.',
      ],
      [
        'What data do you collect?',
        'Your profile, measurements, photo, wardrobe and saves stay in this browser. When you intentionally press Buy, our server processes the product, placement and standard request information needed to send you to the retailer and attribute the click. We do not send your measurements, photo or wardrobe to the retailer.',
      ],
      [
        'Can I start over?',
        'Avatar tab → “Clear everything” wipes your profile, wardrobe, saves and rooms from this device.',
      ],
    ],
  },
]

export function FaqView() {
  return (
    <div className="wrap" style={{ paddingBottom: 110 }}>
      <div className="faq__mast">
        <h2 className="faq__title">FAQ</h2>
        <div className="chips" style={{ justifyContent: 'center' }}>
          {SECTIONS.map((s) => (
            <a key={s.id} className="chip" href={`#faq-${s.id}`}>
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {SECTIONS.map((s) => (
        <section key={s.id} id={`faq-${s.id}`} className="faq__section">
          <div className="faq__left">
            <h3 className="faqhead">{s.title}</h3>
            <p className="muted">{s.sub}</p>
          </div>
          <div className="faq__right">
            {s.qa.map(([q, a]) => (
              <details key={q} className="qa">
                <summary>
                  {q}
                  <span className="qa__icon" aria-hidden="true" />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
