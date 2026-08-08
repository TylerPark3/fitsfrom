import { useEffect, useState } from 'react'
import { socialRepository } from '../../lib/socialRepository'
import { Bookmark } from '../Icons'

/** Like, takes, save, share — the row under every post. */
export function FitEngagementBar({
  postId,
  seed,
  takesCount,
  onOpenTakes,
  shareUrl,
  shareTitle,
  onToast,
}: {
  postId: string
  seed: { likes: number; saves: number }
  takesCount: number
  onOpenTakes: () => void
  shareUrl: string
  shareTitle: string
  onToast: (msg: string) => void
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLiked(socialRepository.isLiked(postId))
    setSaved(socialRepository.isSaved(postId))
  }, [postId])

  const share = async () => {
    const data = { title: shareTitle, url: shareUrl }
    if (navigator.share) {
      try {
        await navigator.share(data)
        return
      } catch {
        // user dismissed the sheet — nothing to report
        return
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      onToast('Link copied')
    } catch {
      onToast(shareUrl)
    }
  }

  return (
    <div className="engage">
      <button
        className={`engage__btn${liked ? ' is-on' : ''}`}
        aria-pressed={liked}
        onClick={() => {
          setLiked(socialRepository.toggleLike(postId))
        }}
      >
        <span className="engage__icon" aria-hidden="true">
          {liked ? '♥' : '♡'}
        </span>
        {(seed.likes + (liked ? 1 : 0)).toLocaleString()}
        <span className="sr-only"> likes</span>
      </button>

      <button className="engage__btn" onClick={onOpenTakes}>
        <span className="engage__icon" aria-hidden="true">
          ✎
        </span>
        {takesCount} {takesCount === 1 ? 'take' : 'takes'}
      </button>

      <button
        className={`engage__btn${saved ? ' is-on' : ''}`}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved' : 'Save this fit'}
        onClick={() => {
          setSaved(socialRepository.toggleSave(postId))
        }}
      >
        <Bookmark filled={saved} />
        {(seed.saves + (saved ? 1 : 0)).toLocaleString()}
      </button>

      <button className="engage__btn engage__btn--end" onClick={() => void share()}>
        <span className="engage__icon" aria-hidden="true">
          ↗
        </span>
        Share
      </button>
    </div>
  )
}
