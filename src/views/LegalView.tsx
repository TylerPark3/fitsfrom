const UPDATED = 'August 7, 2026'

export function LegalView() {
  return (
    <div className="wrap legal" style={{ paddingBottom: 110 }}>
      <header className="legal__mast">
        <span className="eyebrow">THE CLEAR VERSION</span>
        <h1>Trust, in writing.</h1>
        <p>How Fits From handles recommendations, affiliate links, content, and your information.</p>
        <small>Last updated {UPDATED}</small>
      </header>

      <nav className="legal__nav" aria-label="Legal and editorial policies">
        <a href="#affiliate">Affiliate disclosure</a>
        <a href="#editorial">Editorial policy</a>
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
        <a href="#takedown">Content takedown</a>
      </nav>

      <Policy id="affiliate" number="01" title="Affiliate disclosure">
        <p><strong>Fits From may earn a commission when you shop through some links, at no extra cost to you.</strong></p>
        <p>Commission never changes your compatibility score, personalized ranking, product identification, or editorial recommendation. Paid placements are labeled <strong>Sponsored</strong> before you interact with them. A retailer may change its commission, attribution window, availability, price, or program terms at any time.</p>
        <p>Clicking Buy sends you to an independent retailer. Fits From does not process your payment, fulfill the order, set the retailer’s return policy, or receive your card information.</p>
      </Policy>

      <Policy id="editorial" number="02" title="Editorial policy">
        <p>Products are ranked using relevance to your selected taste, sizing profile, budget, wardrobe, stated preferences, and documented cultural context—not by affiliate commission.</p>
        <h3>Identification labels</h3>
        <ul>
          <li><strong>Exact match:</strong> directly tagged, credited, confirmed, or visually conclusive.</li>
          <li><strong>Strongly identified:</strong> distinctive details align and credible evidence supports the match.</li>
          <li><strong>Similar alternative:</strong> a comparable option, never represented as the original.</li>
          <li><strong>Style-inspired:</strong> captures the direction of a fit without claiming equivalence.</li>
          <li><strong>Community identification:</strong> unverified and awaiting moderator review.</li>
        </ul>
        <p>“Worn by” describes documented public wear; it does not imply that the person endorses, sponsors, or partners with Fits From.</p>
        <h3>Images and sources</h3>
        <p>Fits From aims to use owned, licensed, permissioned, officially embedded, or authorized brand and retailer media. Photographer credit is not a substitute for permission. We correct identifications and remove material when credible rights concerns are raised.</p>
      </Policy>

      <Policy id="privacy" number="03" title="Privacy">
        <p>Your profile, measurements, uploaded avatar image, wardrobe, saves, and reactions are currently stored in your browser. Clearing site data or using “Clear everything” removes that local information from the device.</p>
        <p>When you intentionally press a Buy link, the server processes the product ID, merchant destination, placement, timestamp, and standard network request information needed to operate and protect the redirect. It does not intentionally send your measurements, avatar image, wardrobe contents, name, or email to the retailer or affiliate network.</p>
        <p>Affiliate networks and retailers may process the click and set their own cookies after you choose to leave Fits From. Their privacy policies govern activity on their services.</p>
        <p>Fits From does not sell personally identifiable profile information. If synced accounts, payments, or additional analytics launch, this policy must be updated before those features collect data.</p>
      </Policy>

      <Policy id="terms" number="04" title="Terms of use">
        <p>Fits From provides fashion discovery, editorial identification, sizing estimates, and links to third-party retailers. Recommendations and measurements are estimates, not guarantees. Confirm size, price, stock, materials, shipping, and return terms with the retailer before purchasing.</p>
        <p>You may not use Fits From to infringe intellectual-property or privacy rights, impersonate another person, submit unlawful material, manipulate affiliate attribution, scrape protected user information, or interfere with the service.</p>
        <p>Third-party names and trademarks belong to their respective owners. Their appearance identifies products or editorial context and does not imply endorsement.</p>
        <p>The service may change, correct, remove, or suspend content and features. To the extent permitted by law, Fits From is not responsible for third-party retailer transactions or indirect losses resulting from reliance on catalogue information.</p>
      </Policy>

      <Policy id="takedown" number="05" title="Corrections and takedowns">
        <p>If you own content shown on Fits From, represent a depicted person, or believe an identification is inaccurate, send the exact page URL, the material at issue, your relationship to it, and the requested correction or removal.</p>
        <p>Email: <a href="mailto:legal@fitsfrom.com">legal@fitsfrom.com</a></p>
        <p>Until a dedicated inbox is active, use the project owner’s verified contact channel. Credible requests should be acknowledged promptly, and disputed material can be hidden while rights or attribution are reviewed.</p>
      </Policy>

      <p className="legal__note">This plain-language policy is an operating baseline and is not legal advice. Counsel should review it before processing payments, licensing celebrity media at scale, or launching synced accounts.</p>
    </div>
  )
}

function Policy({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode }) {
  return (
    <section className="legal__section" id={id}>
      <div className="legal__index">{number}</div>
      <div className="legal__body"><h2>{title}</h2>{children}</div>
    </section>
  )
}
import type { ReactNode } from 'react'
