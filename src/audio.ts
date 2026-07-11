// Tiny WebAudio synth SFX — no asset files, nothing to load, works offline.
// Side-effect layer: reacts to store changes; NEVER mutates game state.

import { useStore } from './store'

let ctx: AudioContext | null = null
let muted = localStorage.getItem('deni.mute') === '1'

export function isMuted(): boolean {
  return muted
}

export function setMuted(m: boolean) {
  muted = m
  localStorage.setItem('deni.mute', m ? '1' : '0')
}

function ac(): AudioContext | null {
  if (muted) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0) {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + delay
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  build() {
    tone(220, 0.12, 'square', 0.06)
    tone(330, 0.18, 'square', 0.05, 0.08)
  },
  endTurn() {
    tone(392, 0.1, 'sine', 0.07)
    tone(523, 0.16, 'sine', 0.06, 0.09)
  },
  blackout() {
    tone(140, 0.5, 'sawtooth', 0.08)
    tone(70, 0.7, 'sawtooth', 0.07, 0.15)
  },
  win() {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, i * 0.14))
  },
  lose() {
    ;[330, 262, 196].forEach((f, i) => tone(f, 0.35, 'triangle', 0.07, i * 0.18))
  },
}

let initialized = false

/** Subscribe once at app start; diffs the store to pick sounds. */
export function initAudio() {
  if (initialized) return // StrictMode double-mount guard
  initialized = true
  let prevTurn = 0
  let prevPlants = 0
  let prevOver = false
  useStore.subscribe((s) => {
    const st = s.state
    if (!st) return
    if (st.plants.length > prevPlants && st.turn === prevTurn) sfx.build()
    if (st.turn > prevTurn && prevTurn > 0 && st.turn === prevTurn + 1) {
      if (st.lastReport && st.lastReport.blackoutRegions.length > 0) sfx.blackout()
      else sfx.endTurn()
    }
    if (st.gameOver && !prevOver) (st.gameOver.won ? sfx.win : sfx.lose)()
    prevTurn = st.turn
    prevPlants = st.plants.length
    prevOver = Boolean(st.gameOver)
  })
}
