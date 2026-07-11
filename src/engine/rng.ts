// Seeded RNG (mulberry32). The current word LIVES IN GameState — the engine
// never touches Math.random. Advancing the rng returns the next word so state
// stays immutable and every run is replayable from (seed, actionLog).

export function rngNext(word: number): { value: number; next: number } {
  const t = (word + 0x6d2b79f5) | 0
  let x = Math.imul(t ^ (t >>> 15), 1 | t)
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296
  return { value, next: t }
}

/** Integer in [0, n) plus the advanced rng word. */
export function rngInt(word: number, n: number): { value: number; next: number } {
  const r = rngNext(word)
  return { value: Math.floor(r.value * n), next: r.next }
}

export function seedFromString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
