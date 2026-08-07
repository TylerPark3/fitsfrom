import { CATALOG } from '../data/catalog'
import { useStore } from '../lib/store'
import { CheckInk } from './Icons'

const shoe = CATALOG.find((p) => p.category === 'shoes')?.image ?? ''
const skate = CATALOG.find((p) => p.styles.includes('skate') && p.category === 'shoes')?.image ?? shoe

const INTERESTS: { id: string; label: string; img: string }[] = [
  { id: 'Basketball', label: 'Basketball', img: '/fits/sga-arrival.jpg' },
  { id: 'Football', label: 'Football', img: '/fits/lamine-touchline.jpg' },
  { id: 'Hip-hop', label: 'Hip-hop', img: '/fits/flacko-money.jpg' },
  { id: 'Pop & R&B', label: 'Pop & R&B', img: '/fits/bieber-night.jpg' },
  { id: 'K-culture', label: 'K-culture', img: '/fits/v-airport.jpg' },
  { id: 'Film & TV', label: 'Film & TV', img: '/fits/rpattz-paris.jpg' },
  { id: 'Gaming', label: 'Gaming', img: '/fits/lebron-quiet.jpg' },
  { id: 'Thrifting', label: 'Thrifting', img: '/fits/clarkson-tunnel.jpg' },
  { id: 'Outdoors', label: 'Outdoors', img: '/styles/gorp.jpg' },
  { id: 'Tokyo street', label: 'Tokyo street', img: '/styles/japanese.jpg' },
  { id: 'Fragrance', label: 'Fragrance', img: '/scents/versace-eros.png' },
  { id: 'Sneakers', label: 'Sneakers', img: skate },
  { id: 'Yankees', label: 'Yankees', img: '/room/art-yankees.jpg' },
]

/** ESPN-style visual interest grid — tap tiles, they colorize. */
export function InterestPicker() {
  const { profile, setProfile } = useStore()
  const flip = (v: string) =>
    setProfile({
      tags: profile.tags.includes(v)
        ? profile.tags.filter((x) => x !== v)
        : [...profile.tags, v],
    })

  return (
    <div className="intgrid">
      {INTERESTS.map((it) => {
        const on = profile.tags.includes(it.id)
        return (
          <button key={it.id} className="inttile" aria-pressed={on} onClick={() => flip(it.id)}>
            <img src={it.img} alt="" loading="lazy" />
            {on && (
              <span className="inttile__tick">
                <CheckInk size={13} />
              </span>
            )}
            <span className="inttile__label">{it.label}</span>
          </button>
        )
      })}
    </div>
  )
}
