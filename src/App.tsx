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
import { Grid, Hanger, Bookmark, Person, CheckInk } from './components/Icons'
import { Home } from './views/Home'
import { Onboarding } from './views/Onboarding'
import { AvatarView } from './views/AvatarView'
import { Discover } from './views/Discover'
import { WardrobeView } from './views/WardrobeView'
import { SavedView } from './views/SavedView'
import { FitsView } from './views/FitsView'
import { AuthView } from './views/AuthView'
import { FaqView } from './views/FaqView'
import { ProductDrawer } from './components/ProductDrawer'

export type View = 'home' | 'auth' | 'onboarding' | 'discover' | 'fits' | 'avatar' | 'wardrobe' | 'saved' | 'faq'

export function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [view, setView] = useState<View>(() => (loadState().profile.onboarded ? 'discover' : 'home'))
  const [openProduct, setOpenProduct] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<number>()

  useEffect(() => {
    saveState(state)
  }, [state])

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
        setState((s) => ({
          ...s,
          wardrobe: [
            { productId, size, owned, addedAt: Date.now() },
            ...s.wardrobe.filter((w) => w.productId !== productId),
          ],
        })),

      removeFromWardrobe: (productId) =>
        setState((s) => ({ ...s, wardrobe: s.wardrobe.filter((w) => w.productId !== productId) })),

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

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  const go = (v: View) => setView(v)

  return (
    <StoreContext.Provider value={store}>
      <div className="app">
        <Nav
          view={view}
          go={go}
          savedCount={state.saved.length}
          profile={state.profile}
          signedIn={state.signedIn && !!state.account}
        />

        <main>
          {view === 'home' && <Home go={go} />}
          {view === 'auth' && (
            <AuthView onDone={() => go(state.profile.onboarded ? 'discover' : 'onboarding')} />
          )}
          {view === 'onboarding' && <Onboarding onDone={() => go('discover')} />}
          {view === 'discover' && <Discover onOpen={setOpenProduct} go={go} />}
          {view === 'fits' && <FitsView go={go} />}
          {view === 'faq' && <FaqView />}
          {view === 'avatar' && <AvatarView go={go} />}
          {view === 'wardrobe' && <WardrobeView onOpen={setOpenProduct} go={go} />}
          {view === 'saved' && <SavedView onOpen={setOpenProduct} go={go} />}
        </main>

        <footer className="foot">
          <div className="wrap foot__in">
            <div className="logo" style={{ fontSize: 17 }}>
              Fits From<i className="logo__dot" />
            </div>
            <p>
              Live products and prices from each brand’s own store. Your photo and measurements stay
              in this browser.
            </p>
          </div>
        </footer>

        <nav className="tabbar">
          {(
            [
              ['discover', 'Discover', <Grid key="g" />],
              ['fits', 'Fits', <Hanger key="f" />],
              ['avatar', 'Avatar', <Person key="p" />],
              ['saved', 'Saved', <Bookmark key="b" />],
            ] as const
          ).map(([v, label, icon]) => (
            <button key={v} aria-current={view === v} onClick={() => go(v)}>
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {openProduct && (
          <ProductDrawer productId={openProduct} onClose={() => setOpenProduct(null)} />
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
}: {
  view: View
  go: (v: View) => void
  savedCount: number
  profile: Profile
  signedIn: boolean
}) {
  return (
    <header className="nav">
      <div className="wrap nav__inner">
        <button className="logo" onClick={() => go(profile.onboarded ? 'discover' : 'home')}>
          Fits From<i className="logo__dot" />
        </button>

        <div className="nav__links">
          <button className="nav__link" aria-current={view === 'discover'} onClick={() => go('discover')}>
            Discover
          </button>
          <button className="nav__link" aria-current={view === 'fits'} onClick={() => go('fits')}>
            Fits
          </button>
          <button className="nav__link" aria-current={view === 'avatar'} onClick={() => go('avatar')}>
            Avatar
          </button>
          <button
            className="nav__link"
            aria-current={view === 'wardrobe'}
            onClick={() => go('wardrobe')}
          >
            Wardrobe
          </button>
          <button className="nav__link" aria-current={view === 'saved'} onClick={() => go('saved')}>
            Saved
            {savedCount > 0 && <span className="nav__count">{savedCount}</span>}
          </button>
          <button className="nav__link" aria-current={view === 'faq'} onClick={() => go('faq')}>
            FAQ
          </button>
        </div>

        <div className="nav__spacer" />

        <button
          className="nav__me"
          onClick={() => go(signedIn ? 'avatar' : 'auth')}
        >
          <span
            className="nav__avatar"
            style={profile.photo ? { backgroundImage: `url(${profile.photo})` } : undefined}
          >
            {!profile.photo && <Person size={13} />}
          </span>
          {signedIn ? (profile.name.split(' ')[0] || 'You') : 'Create account'}
        </button>
      </div>
    </header>
  )
}
