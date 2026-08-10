/**
 * Supabase — the swap-in for everything currently kept on the device.
 *
 * Nothing here is imported yet. The point of the repositories being interfaces
 * is that turning this on is a one-line change in two files:
 *
 *   socialRepository.ts →  export const socialRepository = supabaseSocial
 *   store / App.tsx     →  hydrate from cloudProfile.load() on sign-in
 *
 * Until the env vars are set, `isCloudEnabled()` is false and the app keeps
 * running exactly as it does now. That matters: launch traffic should not
 * depend on a backend that isn't finished.
 *
 * Setup:
 *   npm i @supabase/supabase-js
 *   supabase/schema.sql  → run once
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  → .env and the Pages project
 */
import type { AppState } from './store'
import type { CommunityId, SocialRepository, Take, Verdict } from './socialRepository'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isCloudEnabled = () => Boolean(URL && ANON)

/**
 * Minimal REST client. Deliberately not the SDK: this is the entire surface we
 * need, it adds no bundle weight to a launch that doesn't use it yet, and
 * swapping to @supabase/supabase-js later changes only this file.
 */
async function rest<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T | null> {
  if (!isCloudEnabled()) return null
  const { token, headers, ...rest } = init
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      ...rest,
      headers: {
        apikey: ANON!,
        Authorization: `Bearer ${token ?? ANON}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...headers,
      },
    })
    if (!res.ok) return null
    const text = await res.text()
    return text ? (JSON.parse(text) as T) : null
  } catch {
    // Offline or blocked — every caller must survive a null.
    return null
  }
}

/* ── profile sync ──────────────────────────────────────────────────────────
   The whole AppState travels as one JSON blob. The shape still changes weekly;
   a column per field would mean a migration every time. Split it out once it
   stops moving. */
export const cloudProfile = {
  async load(userId: string, token: string): Promise<Partial<AppState> | null> {
    const rows = await rest<{ state: Partial<AppState> }[]>(
      `profiles?id=eq.${userId}&select=state`,
      { token },
    )
    return rows?.[0]?.state ?? null
  },

  async save(userId: string, token: string, state: AppState): Promise<boolean> {
    // The photo is a data URL and can run to megabytes. It stays on the device.
    const { profile, ...rest_ } = state
    const safe = { ...rest_, profile: { ...profile, photo: null } }
    const out = await rest(`profiles?on_conflict=id`, {
      method: 'POST',
      token,
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: userId, state: safe, updated_at: new Date().toISOString() }),
    })
    return out !== null
  },
}

/* ── the social layer ──────────────────────────────────────────────────────
   Same interface as the localStorage implementation, so components can't tell
   which one they're talking to. The synchronous methods return whatever was
   last fetched; `prime()` refills the cache. */
interface Session {
  userId: string
  token: string
  handle: string
}

let session: Session | null = null
export const setSession = (s: Session | null) => {
  session = s
}

const cache = {
  takes: new Map<string, Take[]>(),
  ids: new Map<string, CommunityId[]>(),
  likes: new Set<string>(),
  saves: new Set<string>(),
  takeLikes: new Set<string>(),
}

/** Fetch a post's conversation. Call before rendering a drawer. */
export async function prime(postId: string) {
  const takes = await rest<
    { id: string; post_id: string; handle: string; body: string; verdict: Verdict | null; created_at: string }[]
  >(`takes?post_id=eq.${encodeURIComponent(postId)}&select=*&order=created_at.desc`)
  if (takes) {
    cache.takes.set(
      postId,
      takes.map((t) => ({
        id: t.id,
        postId: t.post_id,
        author: t.handle,
        body: t.body,
        verdict: t.verdict ?? undefined,
        at: Date.parse(t.created_at),
        likes: 0,
      })),
    )
  }

  const ids = await rest<
    { id: string; post_id: string; slot: string; brand: string; piece: string; link: string | null; evidence: string | null; created_at: string }[]
  >(`community_ids?post_id=eq.${encodeURIComponent(postId)}&select=*`)
  if (ids) {
    cache.ids.set(
      postId,
      ids.map((i) => ({
        id: i.id,
        postId: i.post_id,
        slot: i.slot,
        brand: i.brand,
        piece: i.piece,
        link: i.link ?? undefined,
        evidence: i.evidence ?? undefined,
        at: Date.parse(i.created_at),
        votes: 0,
      })),
    )
  }
}

export const supabaseSocial: SocialRepository = {
  getTakes: (postId) => cache.takes.get(postId) ?? [],

  addTake(postId, author, body, verdict) {
    const take: Take = {
      id: crypto.randomUUID(),
      postId,
      author: session?.handle ?? author,
      body,
      verdict,
      at: Date.now(),
      likes: 0,
    }
    cache.takes.set(postId, [take, ...(cache.takes.get(postId) ?? [])])
    if (session) {
      void rest('takes', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({
          post_id: postId,
          author_id: session.userId,
          handle: session.handle,
          body,
          verdict: verdict ?? null,
        }),
      })
    }
    return take
  },

  verdicts(postId) {
    const out: Record<Verdict, number> = { heater: 0, solid: 0, mid: 0, nah: 0 }
    for (const t of this.getTakes(postId)) if (t.verdict) out[t.verdict] += 1
    return out
  },

  likeTake(takeId) {
    const on = cache.takeLikes.has(takeId)
    on ? cache.takeLikes.delete(takeId) : cache.takeLikes.add(takeId)
    if (!session) return
    void rest(on ? `take_likes?take_id=eq.${takeId}&user_id=eq.${session.userId}` : 'take_likes', {
      method: on ? 'DELETE' : 'POST',
      token: session.token,
      body: on ? undefined : JSON.stringify({ take_id: takeId, user_id: session.userId }),
    })
  },

  isTakeLiked: (takeId) => cache.takeLikes.has(takeId),
  isLiked: (postId) => cache.likes.has(postId),
  isSaved: (postId) => cache.saves.has(postId),

  toggleLike: (postId) => react(postId, 'like'),
  toggleSave: (postId) => react(postId, 'save'),

  getIds: (postId) => cache.ids.get(postId) ?? [],

  addId(postId, input) {
    const rec: CommunityId = {
      ...input,
      id: crypto.randomUUID(),
      postId,
      at: Date.now(),
      votes: 1,
    }
    cache.ids.set(postId, [rec, ...(cache.ids.get(postId) ?? [])])
    if (session) {
      void rest('community_ids', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({ post_id: postId, author_id: session.userId, ...input }),
      })
    }
    return rec
  },

  voteId(cidId) {
    if (!session) return
    void rest('community_id_votes', {
      method: 'POST',
      token: session.token,
      body: JSON.stringify({ cid_id: cidId, user_id: session.userId }),
    })
  },
}

function react(postId: string, kind: 'like' | 'save'): boolean {
  const set = kind === 'like' ? cache.likes : cache.saves
  const on = set.has(postId)
  on ? set.delete(postId) : set.add(postId)
  if (session) {
    void rest(
      on
        ? `post_reactions?post_id=eq.${encodeURIComponent(postId)}&user_id=eq.${session.userId}&kind=eq.${kind}`
        : 'post_reactions',
      {
        method: on ? 'DELETE' : 'POST',
        token: session.token,
        body: on ? undefined : JSON.stringify({ post_id: postId, user_id: session.userId, kind }),
      },
    )
  }
  return !on
}

/** Demand signal. No user id attached — what people look for, not who looked. */
export function logSearchRemote(term: string) {
  void rest('searches', { method: 'POST', body: JSON.stringify({ term }) })
}
