/**
 * Everything the Tunnel writes: likes, saves, takes and community IDs.
 *
 * The UI only ever talks to this interface, so swapping the backing store for
 * Supabase is a matter of writing a second implementation of `SocialRepository`
 * and exporting that instead. Nothing in a component knows about localStorage.
 */
export interface Take {
  id: string
  postId: string
  author: string
  body: string
  at: number
  likes: number
  /** Seeded demo takes are labelled so they're never mistaken for real users. */
  seeded?: boolean
}

export interface CommunityId {
  id: string
  postId: string
  slot: string
  brand: string
  piece: string
  link?: string
  evidence?: string
  at: number
  votes: number
}

export interface SocialRepository {
  getTakes(postId: string): Take[]
  addTake(postId: string, author: string, body: string): Take
  likeTake(takeId: string): void
  isTakeLiked(takeId: string): boolean

  isLiked(postId: string): boolean
  toggleLike(postId: string): boolean
  isSaved(postId: string): boolean
  toggleSave(postId: string): boolean

  getIds(postId: string): CommunityId[]
  addId(postId: string, input: Omit<CommunityId, 'id' | 'postId' | 'at' | 'votes'>): CommunityId
  voteId(idcId: string): void
}

const KEY = 'lapel.social.v1'

interface Bag {
  takes: Take[]
  takeLikes: string[]
  likes: string[]
  saves: string[]
  ids: CommunityId[]
}

const EMPTY: Bag = { takes: [], takeLikes: [], likes: [], saves: [], ids: [] }

function read(): Bag {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Bag>) }
  } catch {
    return { ...EMPTY }
  }
}

function write(bag: Bag) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bag))
  } catch {
    /* quota or private mode — interactions just don't persist */
  }
}

/** A handful of realistic takes so the drawer isn't empty on first open. */
const SEED: Record<string, Omit<Take, 'postId'>[]> = {
  'sga-leaguefits-mvp': [
    {
      id: 'seed-1',
      author: 'marc',
      body: 'leaving the shirt open is the entire fit. buttoned it\u2019s nothing',
      at: Date.parse('2026-08-07T17:10:00Z'),
      likes: 24,
      seeded: true,
    },
    {
      id: 'seed-2',
      author: 'eli',
      body: 'anyone got the denim shirt? snap front, two pockets',
      at: Date.parse('2026-08-07T17:38:00Z'),
      likes: 11,
      seeded: true,
    },
    {
      id: 'seed-3',
      author: 'sam',
      body: 'four pieces and he wins fit of the year. that\u2019s the flex',
      at: Date.parse('2026-08-07T18:02:00Z'),
      likes: 8,
      seeded: true,
    },
  ],
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

export const socialRepository: SocialRepository = {
  getTakes(postId) {
    const bag = read()
    const seeded = (SEED[postId] ?? []).map((t) => ({ ...t, postId }))
    const mine = bag.takes.filter((t) => t.postId === postId)
    return [...mine, ...seeded].sort((a, b) => b.at - a.at)
  },

  addTake(postId, author, body) {
    const bag = read()
    const take: Take = {
      id: uid('take'),
      postId,
      author: author || 'you',
      body,
      at: Date.now(),
      likes: 0,
    }
    bag.takes = [take, ...bag.takes]
    write(bag)
    return take
  },

  likeTake(takeId) {
    const bag = read()
    const i = bag.takeLikes.indexOf(takeId)
    if (i >= 0) bag.takeLikes.splice(i, 1)
    else bag.takeLikes.push(takeId)
    write(bag)
  },

  isTakeLiked(takeId) {
    return read().takeLikes.includes(takeId)
  },

  isLiked(postId) {
    return read().likes.includes(postId)
  },

  toggleLike(postId) {
    const bag = read()
    const on = bag.likes.includes(postId)
    bag.likes = on ? bag.likes.filter((id) => id !== postId) : [postId, ...bag.likes]
    write(bag)
    return !on
  },

  isSaved(postId) {
    return read().saves.includes(postId)
  },

  toggleSave(postId) {
    const bag = read()
    const on = bag.saves.includes(postId)
    bag.saves = on ? bag.saves.filter((id) => id !== postId) : [postId, ...bag.saves]
    write(bag)
    return !on
  },

  getIds(postId) {
    return read()
      .ids.filter((i) => i.postId === postId)
      .sort((a, b) => b.votes - a.votes || b.at - a.at)
  },

  addId(postId, input) {
    const bag = read()
    const rec: CommunityId = { ...input, id: uid('cid'), postId, at: Date.now(), votes: 1 }
    bag.ids = [rec, ...bag.ids]
    write(bag)
    return rec
  },

  voteId(idcId) {
    const bag = read()
    const rec = bag.ids.find((i) => i.id === idcId)
    if (rec) {
      rec.votes += 1
      write(bag)
    }
  },
}
