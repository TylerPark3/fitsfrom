import { useState } from 'react'
import type { View } from '../App'
import { CATALOG } from '../data/catalog'
import { useStore } from '../lib/store'
import { ProductCard } from '../components/ProductCard'
import { Arrow, Plus, Trash } from '../components/Icons'
import { Type } from '../components/Type'

export function SavedView({ onOpen, go }: { onOpen: (id: string) => void; go: (v: View) => void }) {
  const { saved, collections, createCollection, deleteCollection, renameCollection, toast } =
    useStore()
  const [tab, setTab] = useState<string>('all')

  const ids = tab === 'all' ? saved : (collections.find((c) => c.id === tab)?.productIds ?? [])
  const items = ids.map((id) => CATALOG.find((p) => p.id === id)!).filter(Boolean)
  const total = items.reduce((n, p) => n + p.price, 0)
  const current = collections.find((c) => c.id === tab)

  return (
    <div className="wrap" style={{ paddingBottom: 100 }}>
      <div className="pagehead">
        <span className="eyebrow"><Type text="SAVED — YOUR PERSONAL COLLECTION" speed={18} /></span>
        <h2>The things you keep coming back to.</h2>
      </div>

      <div className="tabs">
        <button className="chip" aria-pressed={tab === 'all'} onClick={() => setTab('all')}>
          All saved <span className="opt__n">{saved.length}</span>
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            className="chip"
            aria-pressed={tab === c.id}
            onClick={() => setTab(c.id)}
          >
            {c.name} <span className="opt__n">{c.productIds.length}</span>
          </button>
        ))}
        <button
          className="chip"
          onClick={() => {
            const name = prompt('Name this collection')?.trim()
            if (!name) return
            setTab(createCollection(name))
            toast(`Created ${name}`)
          }}
        >
          <Plus size={13} /> New collection
        </button>
      </div>

      {current && (
        <div
          className="row"
          style={{ marginBottom: 20, marginTop: -6, gap: 6, flexWrap: 'wrap' }}
        >
          <button
            className="btn btn--quiet btn--sm"
            onClick={() => {
              const name = prompt('Rename collection', current.name)?.trim()
              if (name) renameCollection(current.id, name)
            }}
          >
            Rename
          </button>
          <button
            className="btn btn--quiet btn--sm"
            onClick={() => {
              if (!confirm(`Delete “${current.name}”? The saved items themselves stay.`)) return
              deleteCollection(current.id)
              setTab('all')
              toast('Collection deleted')
            }}
          >
            <Trash /> Delete
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">
          <h3>{tab === 'all' ? 'Nothing saved yet.' : `“${current?.name}” is empty.`}</h3>
          <p>{tab === 'all' ? 'Bookmark any card and it lands here.' : 'Add pieces from any product page.'}</p>
          <button className="btn btn--primary" onClick={() => go('discover')}>
            Browse the edit <Arrow />
          </button>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <span className="toolbar__count">
              <b>{items.length}</b> saved · ${Math.round(total)} to buy all of it
            </span>
          </div>
          <div className="grid">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={onOpen} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
