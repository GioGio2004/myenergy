// ============================================================================
// SaveRepo — THE frozen teammate contract (docs/03 §2, dev rules §1).
// FROZEN AFTER M0. Changing the interface requires BOTH track owners agreeing,
// in person. AUTH track implements CloudSaveRepo against it; GAME track never
// looks inside src/auth/ or convex/.
// ============================================================================

import Dexie, { type EntityTable } from 'dexie'
import type { GameState } from '../engine/types'

export interface SaveSlot {
  id: string // 'current' | 'snap0' | 'snap1' | 'snap2'
  updatedAt: number // epoch ms (services layer may use Date — engine may not)
  state: GameState
}

export interface ScoreEntry {
  name: string
  score: number
  region: string
  grade: string // 'S' | 'A' | 'B' | 'C'
}

export interface SaveRepo {
  /** Latest save for the slot (default 'current'), or null. */
  load(id?: string): Promise<SaveSlot | null>
  /** Persist as 'current' AND rotate the 3 snapshots. Called after EVERY turn. */
  persist(state: GameState): Promise<void>
  listSnapshots(): Promise<SaveSlot[]>
  submitScore(entry: ScoreEntry): Promise<void>
}

// ============================== LocalSaveRepo ==============================
// Dexie/IndexedDB — always on, guest-first. The game never waits for network.

const db = new Dexie('deni') as Dexie & {
  saves: EntityTable<SaveSlot, 'id'>
  scores: EntityTable<ScoreEntry & { id?: number }, 'id'>
}
db.version(1).stores({ saves: 'id, updatedAt', scores: '++id, score' })

export class LocalSaveRepo implements SaveRepo {
  async load(id: string = 'current'): Promise<SaveSlot | null> {
    return (await db.saves.get(id)) ?? null
  }

  async persist(state: GameState): Promise<void> {
    const updatedAt = Date.now()
    await db.saves.put({ id: 'current', updatedAt, state })
    await db.saves.put({ id: `snap${state.turn % 3}`, updatedAt, state })
  }

  async listSnapshots(): Promise<SaveSlot[]> {
    const snaps = await db.saves.where('id').startsWith('snap').toArray()
    return snaps.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async submitScore(entry: ScoreEntry): Promise<void> {
    await db.scores.add(entry)
  }
}

// ============================== CloudSaveRepo ==============================
// AUTH TRACK: implement with Convex (+ Dexie outbox for offline queue). Must
// stay a silent no-op when VITE_CONVEX_URL is absent — keyless boot is CI.

export class CloudSaveRepo implements SaveRepo {
  readonly available = Boolean(import.meta.env.VITE_CONVEX_URL)
  async load(): Promise<SaveSlot | null> {
    return null // TODO(auth): Convex query when signed in
  }
  async persist(_state: GameState): Promise<void> {
    // TODO(auth): queue to outbox, flush on 'online'/visibilitychange
  }
  async listSnapshots(): Promise<SaveSlot[]> {
    return []
  }
  async submitScore(_entry: ScoreEntry): Promise<void> {
    // TODO(auth): Convex leaderboard mutation
  }
}

// Composite: local always wins for reads (newest-timestamp merge is AUTH-track
// work at M7); cloud writes are additive and must never block or throw upward.

class CompositeSaveRepo implements SaveRepo {
  private local = new LocalSaveRepo()
  private cloud = new CloudSaveRepo()
  load(id?: string) {
    return this.local.load(id)
  }
  async persist(state: GameState) {
    await this.local.persist(state)
    this.cloud.persist(state).catch(() => {})
  }
  listSnapshots() {
    return this.local.listSnapshots()
  }
  async submitScore(entry: ScoreEntry) {
    await this.local.submitScore(entry)
    this.cloud.submitScore(entry).catch(() => {})
  }
}

export const saveRepo: SaveRepo = new CompositeSaveRepo()
