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
        'Yes — products, prices and images come from each brand’s live store feed. Stock moves fast, so always confirm at the brand’s checkout.',
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
        'Curated by moderators from public appearances, credited to their source. Player-owned Instagram embeds are coming so every photo links back to the person who posted it.',
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
    id: 'sizing',
    title: 'Sizing & avatar',
    sub: 'Why every card shows your size.',
    qa: [
      [
        'How does size recommendation work?',
        'Your height and weight seed an estimate; chest, waist, inseam and shoe sharpen it. Each product then maps your measurements to its size system — including brands that run big or small.',
      ],
      [
        'Is the photo I upload private?',
        'Completely. It’s stored in your browser’s local storage and never uploaded anywhere. Remove it any time from the Avatar tab.',
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
        'None. No analytics, no tracking pixels, no server. When synced accounts launch, this answer will update honestly.',
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
            <h3 className="serif">{s.title}</h3>
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
