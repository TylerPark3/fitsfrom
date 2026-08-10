import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_STATE,
  StoreContext,
  loadState,
  saveState,
  type Account,
  type AppState,
  type Profile,
  type Store,
} from './lib/store'
import { Grid, Hanger, Person, CheckInk } from './components/Icons'
import { installClickSounds, isMuted, setMuted } from './lib/click'
import { PRO, halfOf } from './lib/plan'
import { CATALOG } from './data/catalog'
import { Home } from './views/Home'
import { Onboarding } from './views/Onboarding'
import { AvatarView } from './views/AvatarView'
import { Discover } from './views/Discover'
import { WardrobeView } from './views/WardrobeView'
import { SavedView } from './views/SavedView'
import { FitsView } from './views/FitsView'
import { TunnelView } from './views/TunnelView'
import { BrandView } from './views/BrandView'
import { AuthView } from './views/AuthView'
import { FaqView } from './views/FaqView'
import { LegalView } from './views/LegalView'
import { ProductDrawer } from './components/ProductDrawer'

export type View = 'home' | 'auth' | 'onboarding' | 'discover' | 'tunnel' | 'brand' | 'fits' | 'avatar' | 'wardrobe' | 'saved' | 'faq' | 'legal'

const TRIAL_DAYS = 15
const GATED: View[] = ['discover', 'fits', 'wardrobe', 'saved', 'avatar']

/** /tunnel/<slug> — a post has a real address without pulling in a router. */
const readSlug = () => {
  const m = window.location.pathname.match(/^\/tunnel\/([\w-]+)/)
  return m ? m[1] : null
}

export function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [view, setView] = useState<View>(() =>
    readSlug() ? 'tunnel' : loadState().profile.onboarded ? 'discover' : 'home',
  )
  const [openProduct, setOpenProduct] = useState<string | null>(null)
  const [tunnelSlug, setTunnelSlug] = useState<string | null>(() => readSlug())
  const [brand, setBrand] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<number>()

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    installClickSounds()
  }, [])

  const toast = useCallback((message: string) => {
    setToastMsg(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2200)
  }, [])

  const store: Store = useMemo(
    () => ({
      ...state,
      toast,
      setProfile: (patch: Partial<Profile>) =>
        setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })),

      toggleSaved: (productId) =>
        setState((s) => ({
          ...s,
          saved: s.saved.includes(productId)
            ? s.saved.filter((id) => id !== productId)
            : [productId, ...s.saved],
        })),

      addToWardrobe: (productId, size, owned) =>
        setState((s) => {
          // Free closets hold five up top and five below. Replacing a piece
          // you already have never counts against you.
          const already = s.wardrobe.some((w) => w.productId === productId)
          const p = CATALOG.find((x) => x.id === productId)
          if (!already && p && !s.account?.pro) {
            const half = halfOf(p.category)
            const n =
              s.wardrobe.filter((w) => {
                const q = CATALOG.find((x) => x.id === w.productId)
                return q && halfOf(q.category) === half
              }).length + s.customs.filter((c) => halfOf(c.category) === half).length
            const cap = half === 'tops' ? PRO.freeTops : PRO.freeBottoms
            if (n >= cap) {
              toast(`Free closet holds ${cap} ${half} — Pro is ${PRO.label}`)
              return s
            }
          }
          return {
            ...s,
            wardrobe: [
              { productId, size, owned, addedAt: Date.now() },
              ...s.wardrobe.filter((w) => w.productId !== productId),
            ],
          }
        }),

      wear: (slot, ref) =>
        setState((s) => ({
          ...s,
          mannequin:
            s.mannequin[slot] === ref
              ? Object.fromEntries(Object.entries(s.mannequin).filter(([k]) => k !== slot))
              : { ...s.mannequin, [slot]: ref },
        })),

      toggleDislike: (productId) =>
        setState((s) => ({
          ...s,
          disliked: s.disliked.includes(productId)
            ? s.disliked.filter((id) => id !== productId)
            : [productId, ...s.disliked],
          // a piece you dislike shouldn't stay sitting in your saves
          saved: s.saved.filter((id) => id !== productId),
        })),

      removeFromWardrobe: (productId) =>
        setState((s) => ({ ...s, wardrobe: s.wardrobe.filter((w) => w.productId !== productId) })),

      updateWardrobe: (productId, patch) =>
        setState((s) => ({
          ...s,
          wardrobe: s.wardrobe.map((w) => (w.productId === productId ? { ...w, ...patch } : w)),
        })),

      createCollection: (name) => {
        const id = `c${Date.now().toString(36)}`
        setState((s) => ({ ...s, collections: [...s.collections, { id, name, productIds: [] }] }))
        return id
      },

      renameCollection: (id, name) =>
        setState((s) => ({
          ...s,
          collections: s.collections.map((c) => (c.id === id ? { ...c, name } : c)),
        })),

      deleteCollection: (id) =>
        setState((s) => ({ ...s, collections: s.collections.filter((c) => c.id !== id) })),

      toggleInCollection: (collectionId, productId) =>
        setState((s) => ({
          ...s,
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : {
                  ...c,
                  productIds: c.productIds.includes(productId)
                    ? c.productIds.filter((p) => p !== productId)
                    : [productId, ...c.productIds],
                },
          ),
        })),

      createAccount: (a: Account) =>
        setState((s) => ({ ...s, account: a, signedIn: true })),

      addCustom: (piece) => setState((s) => ({ ...s, customs: [piece, ...s.customs] })),

      pushFeedback: (kind, itemIds) =>
        setState((s) => ({
          ...s,
          // Keep the last 200 signals — enough to calibrate, small enough to store.
          feedback: [{ kind, itemIds, at: Date.now() }, ...(s.feedback ?? [])].slice(0, 200),
        })),

      toggleScentFav: (id) =>
        setState((s) => ({
          ...s,
          scentFavs: s.scentFavs.includes(id)
            ? s.scentFavs.filter((x) => x !== id)
            : [id, ...s.scentFavs],
        })),

      removeCustom: (id) =>
        setState((s) => ({
          ...s,
          customs: s.customs.filter((c) => c.id !== id),
          outfits: s.outfits.map((o) => ({ ...o, refs: o.refs.filter((r) => r !== id) })),
        })),

      createOutfit: (name) => {
        const id = `o${Date.now().toString(36)}`
        setState((s) => ({ ...s, outfits: [...s.outfits, { id, name, refs: [] }] }))
        return id
      },

      deleteOutfit: (id) =>
        setState((s) => ({ ...s, outfits: s.outfits.filter((o) => o.id !== id) })),

      toggleOutfitRef: (outfitId, ref) =>
        setState((s) => ({
          ...s,
          outfits: s.outfits.map((o) =>
            o.id !== outfitId
              ? o
              : {
                  ...o,
                  refs: o.refs.includes(ref)
                    ? o.refs.filter((r) => r !== ref)
                    : [...o.refs, ref],
                },
          ),
        })),

      signIn: () => setState((s) => ({ ...s, signedIn: true })),

      signOut: () => setState((s) => ({ ...s, signedIn: false })),

      reset: () => setState(DEFAULT_STATE),
    }),
    [state, toast],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenProduct(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Pack guardrail: preserve scroll per view instead of always jumping to top.
  const scrollMem = useRef<Record<string, number>>({})
  const prevView = useRef(view)
  useEffect(() => {
    scrollMem.current[prevView.current] = window.scrollY
    prevView.current = view
    window.scrollTo({ top: scrollMem.current[view] ?? 0 })
  }, [view])

  // ALD-style cover: the landing image owns the whole screen until you tap in.
  // It belongs to the visit, not the view — once you're through it stays down
  // for the rest of the session, and a fresh tab arms it again.
  const [entered, setEntered] = useState(() => {
    try {
      return sessionStorage.getItem('lapel.entered') === '1'
    } catch {
      return false
    }
  })
  const enter = useCallback(() => {
    setEntered(true)
    try {
      sessionStorage.setItem('lapel.entered', '1')
    } catch {
      /* private mode — the cover just re-arms, which is harmless */
    }
  }, [])
  const covered = view === 'home' && !entered

  const go = (v: View) => {
    // Navigating never re-arms the cover — you already came through it.
    enter()
    setView(v)
  }

  // Scrolling past the hero counts as entering: the nav comes back and the
  // rest of the page is just there, the way a normal site behaves.
  useEffect(() => {
    if (!covered) return
    const onScroll = () => {
      if (window.scrollY > 60) enter()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [covered, enter])

  const daysLeft = state.account
    ? TRIAL_DAYS - Math.floor((Date.now() - state.account.createdAt) / 86_400_000)
    : TRIAL_DAYS
  const trialOver = !!state.account && daysLeft <= 0

  return (
    <StoreContext.Provider value={store}>
      <div className={`app${covered ? ' app--covered' : ''}`}>
        {covered && (
          <button
            className="cover"
            aria-label="Enter Cosign"
            onClick={enter}
          />
        )}
        {!covered && (
        <Nav
          view={view}
          go={go}
          savedCount={state.saved.length}
          profile={state.profile}
          signedIn={state.signedIn && !!state.account}
          daysLeft={state.account ? daysLeft : null}
        />
        )}

        <main>
          <div className="viewfade" key={view}>
          {trialOver && GATED.includes(view) ? (
            <div className="wrap" style={{ paddingBottom: 110 }}>
              <div className="pagehead" style={{ textAlign: 'center', paddingTop: 80 }}>
                <span className="eyebrow" style={{ color: 'var(--red)' }}>
                  Day {TRIAL_DAYS} of {TRIAL_DAYS} — trial complete
                </span>
                <h2 className="fitcheck" style={{ margin: '12px 0 8px' }}>
                  The vault is sealed
                </h2>
                <p className="mono-line" style={{ margin: '0 auto', maxWidth: '54ch' }}>
                  YOUR CLOSET, SAVES AND FILES ARE KEPT SAFE. PRO OPENS EVERYTHING — $5/MO,
                  LAUNCHING SOON.
                </p>
                <div className="row" style={{ justifyContent: 'center', marginTop: 28, gap: 10 }}>
                  <button
                    className="btn btn--primary btn--lg"
                    onClick={() => {
                      try {
                        localStorage.setItem('lapel.pro.waitlist', '1')
                      } catch {}
                      toast('You’re on the Pro list — first to know')
                    }}
                  >
                    Get Pro first
                  </button>
                  <button className="btn btn--ghost btn--lg" onClick={() => go('faq')}>
                    Why a trial?
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
          {view === 'home' && (
            <Home
              go={go}
              onOpen={setOpenProduct}
              onBrand={(b) => {
                setBrand(b)
                setView('brand')
              }}
              onTunnel={(s) => {
                setTunnelSlug(s)
                setView('tunnel')
                window.history.pushState({}, '', s ? `/tunnel/${s}` : '/tunnel')
              }}
            />
          )}
          {view === 'brand' && (
            <BrandView
              brand={brand}
              onOpen={setOpenProduct}
              onBrand={(b) => {
                setBrand(b)
                setView('brand')
              }}
            />
          )}
          {view === 'tunnel' && (
            <TunnelView
              slug={tunnelSlug}
              onOpen={setOpenProduct}
              onBrand={(b) => {
                setBrand(b)
                setView('brand')
              }}
              onSlug={(s) => {
                setTunnelSlug(s)
                const path = s ? `/tunnel/${s}` : '/tunnel'
                window.history.pushState({}, '', path)
              }}
            />
          )}
          {view === 'auth' && (
            <AuthView onDone={() => go(state.profile.onboarded ? 'discover' : 'onboarding')} />
          )}
          {view === 'onboarding' && <Onboarding onDone={() => go('discover')} />}
          {view === 'discover' && <Discover onOpen={setOpenProduct} go={go} />}
          {view === 'fits' && <FitsView go={go} />}
          {view === 'faq' && <FaqView />}
          {view === 'legal' && <LegalView />}
          {view === 'avatar' && <AvatarView go={go} />}
          {view === 'wardrobe' && <WardrobeView onOpen={setOpenProduct} go={go} />}
          {view === 'saved' && <SavedView onOpen={setOpenProduct} go={go} />}
            </>
          )}
          </div>
        </main>

        <footer className="foot">
          <div className="wrap foot__in">
            <div className="logo" style={{ fontSize: 16 }}>
              <span className="logo__word">COSIGN</span>
            </div>
            <p>
              Live products and prices from each brand’s own store. Your photo and measurements stay
              in this browser.
            </p>
            <button className="foot__legal" onClick={() => go('legal')}>Privacy · Terms · Editorial · Affiliate disclosure</button>
          </div>
        </footer>

        <nav className="tabbar">
          {(
            [
              ['tunnel', 'Tunnel', <Hanger key="t" />],
              ['discover', 'Explore', <Grid key="g" />],
              ['wardrobe', 'Wardrobe', <Hanger key="w" />],
              ['avatar', 'Avatar', <Person key="p" />],
            ] as const
          ).map(([v, label, icon]) => (
            <button key={v} aria-current={view === v} onClick={() => go(v)}>
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {openProduct && (
          <ProductDrawer
            productId={openProduct}
            onClose={() => setOpenProduct(null)}
            onOpenProduct={setOpenProduct}
          />
        )}

        {toastMsg && (
          <div className="toast" role="status">
            <CheckInk size={14} />
            {toastMsg}
          </div>
        )}
      </div>
    </StoreContext.Provider>
  )
}

function Nav({
  view,
  go,
  savedCount,
  profile,
  signedIn,
  daysLeft,
}: {
  view: View
  go: (v: View) => void
  savedCount: number
  profile: Profile
  signedIn: boolean
  daysLeft: number | null
}) {
  const [sound, setSound] = useState(!isMuted())
  return (
    <header className="nav">
      <div className="wrap nav__inner">
        <button className="logo" onClick={() => go('home')}>
          <span className="logo__word">COSIGN</span>
        </button>

        <div className="nav__links">
          <button
            className="nav__link"
            aria-current={view === 'home' || view === 'tunnel'}
            onClick={() => go('home')}
          >
            The Tunnel
          </button>
          <button className="nav__link" aria-current={view === 'fits'} onClick={() => go('fits')}>
            Fits
          </button>
          <button className="nav__link" aria-current={view === 'discover'} onClick={() => go('discover')}>
            Explore
          </button>
          <button
            className="nav__link"
            aria-current={view === 'wardrobe'}
            onClick={() => go('wardrobe')}
          >
            Wardrobe
            {savedCount > 0 && <span className="nav__count">{savedCount}</span>}
          </button>
          <button className="nav__link" aria-current={view === 'faq'} onClick={() => go('faq')}>
            FAQ
          </button>
        </div>

        <div className="nav__spacer" />

        <button
          className="iconbtn"
          aria-label={sound ? 'Mute clicks' : 'Unmute clicks'}
          aria-pressed={!sound}
          onClick={() => {
            const next = !sound
            setMuted(!next)
            setSound(next)
          }}
          style={{ fontSize: 13 }}
        >
          {sound ? '🔊' : '🔇'}
        </button>

        {daysLeft !== null && daysLeft > 0 && (
          <span className="trialpill">{daysLeft}D TRIAL</span>
        )}

        <button
          className="nav__me"
          aria-current={view === 'avatar'}
          title="Your build"
          onClick={() => go('avatar')}
        >
          <span
            className="nav__avatar"
            style={
              profile.photo
                ? {
                    backgroundImage: `url(${profile.photo})`,
                    backgroundSize: `${profile.faceZoom * 100}%`,
                    backgroundPosition: `${profile.faceX}% ${profile.faceY}%`,
                  }
                : undefined
            }
          >
            {!profile.photo && <Person size={13} />}
          </span>
          {signedIn ? (profile.name.split(' ')[0] || 'You') : 'Create account'}
        </button>
      </div>
    </header>
  )
}
