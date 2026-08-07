export function AffiliateDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`affiliate-note${compact ? ' affiliate-note--compact' : ''}`}>
      <strong>Affiliate links.</strong> We may earn a commission at no extra cost to you. It never changes your match score or ranking.
    </p>
  )
}
