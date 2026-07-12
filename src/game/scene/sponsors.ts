// In-game sponsor placements: styled name-plaques on roadside billboards, house
// banners, and plant-side placards. This is the MONETIZATION demo surface — it
// shows judges (who are our partners) how MyEnerge sells branded space inside the
// simulator. Everything here is generated from a canvas (works 100% offline, no
// asset downloads, no copyright risk). Drop a real logo at public/sponsors/<id>.png
// and the board upgrades itself to the real artwork at runtime.

import * as THREE from 'three'

export interface Sponsor {
  id: string
  name: string
  color: number // plaque background / brand accent
  light?: boolean // true → dark ink text on a light plaque
}

// The EnergoHack 2026 partners & organisers. Ordered so the marquee names lead.
export const SPONSORS: Sponsor[] = [
  { id: 'socar', name: 'SOCAR', color: 0x00a9c7 },
  { id: 'greda', name: 'GREDA', color: 0x2f9e4f },
  { id: 'gita', name: 'GITA', color: 0xf2a541, light: true },
  { id: 'technopark', name: 'TECHNOPARK', color: 0x6a4c93 },
  { id: 'vdc', name: 'VDC ENERGY', color: 0x2f6fa8 },
  { id: 'grpo', name: 'GEORGIAN RENEWABLE POWER', color: 0x1f8f74 },
  { id: 'hunnewell', name: 'HUNNEWELL CEMENT', color: 0xb0752a },
]

export const sponsorById = (id: string): Sponsor =>
  SPONSORS.find((s) => s.id === id) ?? SPONSORS[0]

// Which sponsor "owns" each buildable's placard — placed HONESTLY: gas → SOCAR
// (that is literally their product), renewables → the renewable brands, storage/
// grid → VDC. The gas placard doubles as a teachable moment, not an endorsement.
const PLANT_SPONSOR: Record<string, string> = {
  gaspeaker: 'socar',
  turbine: 'greda',
  windfarm: 'greda',
  offshore: 'greda',
  commsolar: 'grpo',
  solarfarm: 'grpo',
  hpp: 'grpo',
  mediumhydro: 'grpo',
  smallhydro: 'grpo',
  pumpedhydro: 'vdc',
  battery: 'vdc',
  translink: 'vdc',
  cableshare: 'gita',
}
export const plantSponsor = (type: string): Sponsor | null =>
  PLANT_SPONSOR[type] ? sponsorById(PLANT_SPONSOR[type]) : null

// ---- shared, cached materials (one per sponsor; boards reuse them) ----
const postMat = new THREE.MeshStandardMaterial({ color: 0x6b5c48, roughness: 0.85, flatShading: true })
const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2434, roughness: 0.8, flatShading: true })
const faceMatCache = new Map<string, THREE.MeshBasicMaterial>()

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Render a clean sponsor plaque to a canvas texture: colored rounded card, a thin
 *  accent bar, the sponsor name auto-fitted, and a small "MyEnerge partner" kicker. */
function makeSponsorTexture(s: Sponsor): THREE.CanvasTexture {
  const W = 512
  const H = 288
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const bg = new THREE.Color(s.color)
  const ink = s.light ? '#241a12' : '#ffffff'
  const sub = s.light ? 'rgba(36,26,18,0.62)' : 'rgba(255,255,255,0.72)'

  // transparent margin, then the card
  ctx.clearRect(0, 0, W, H)
  const m = 18
  roundRect(ctx, m, m, W - m * 2, H - m * 2, 34)
  ctx.fillStyle = `#${bg.getHexString()}`
  ctx.fill()
  // inner darker/lighter frame line for a "printed sign" feel
  ctx.lineWidth = 8
  ctx.strokeStyle = s.light ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)'
  roundRect(ctx, m + 10, m + 10, W - (m + 10) * 2, H - (m + 10) * 2, 26)
  ctx.stroke()

  // top accent bar
  ctx.fillStyle = s.light ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.28)'
  roundRect(ctx, m + 26, m + 26, W - (m + 26) * 2, 12, 6)
  ctx.fill()

  // sponsor name — auto-shrink to fit one or two lines
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const words = s.name.split(' ')
  const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [s.name]
  const maxW = W - m * 2 - 60
  let size = lines.length > 1 ? 62 : 92
  const fit = (px: number) => {
    ctx.font = `800 ${px}px "Helvetica Neue", Arial, sans-serif`
    return Math.max(...lines.map((l) => ctx.measureText(l).width))
  }
  while (fit(size) > maxW && size > 26) size -= 3
  const lh = size * 1.06
  const cy = H / 2 + 6 - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, W / 2, cy + i * lh))

  // kicker
  ctx.fillStyle = sub
  ctx.font = `700 26px "Helvetica Neue", Arial, sans-serif`
  ctx.fillText('MyEnerge partner', W / 2, H - m - 30)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Shared unlit material for a sponsor (so the plaque reads bright and legible
 *  under the scene's ACES tone-mapping). Attempts a real-logo override once. */
function faceMaterial(s: Sponsor): THREE.MeshBasicMaterial {
  const cached = faceMatCache.get(s.id)
  if (cached) return cached
  const mat = new THREE.MeshBasicMaterial({ map: makeSponsorTexture(s), transparent: true, side: THREE.DoubleSide, toneMapped: false })
  faceMatCache.set(s.id, mat)
  // Drop-in real logo: if public/sponsors/<id>.png exists, swap it in. HEAD-check
  // first so a missing file is a silent 404 (fetch), not a noisy texture error.
  const url = `${import.meta.env.BASE_URL || '/'}sponsors/${s.id}.png`
  fetch(url, { method: 'HEAD' })
    .then((r) => {
      if (!r.ok) return
      new THREE.TextureLoader().load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 4
        mat.map = tex
        mat.needsUpdate = true
      })
    })
    .catch(() => {}) // offline / missing → keep the generated plaque
  return mat
}

/** A roadside advertising billboard: two posts holding a framed sponsor panel.
 *  Base sits at y=0; the caller seats it on the terrain. Faces local +Z. */
export function makeSponsorBoard(s: Sponsor, scale = 1): THREE.Group {
  const g = new THREE.Group()
  const panelW = 1.15
  const panelH = 0.66
  const postH = 0.62
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, postH + panelH, 6), postMat)
    post.position.set(sx * panelW * 0.42, (postH + panelH) / 2, 0)
    post.castShadow = true
    g.add(post)
  }
  const cy = postH + panelH / 2
  const frame = new THREE.Mesh(new THREE.BoxGeometry(panelW + 0.08, panelH + 0.08, 0.05), frameMat)
  frame.position.set(0, cy, 0)
  frame.castShadow = true
  g.add(frame)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), faceMaterial(s))
  face.position.set(0, cy, 0.031)
  g.add(face)
  g.scale.setScalar(scale)
  g.userData.sponsor = s.id
  return g
}

/** A small ground placard next to a built plant: one short post + a compact sign. */
export function makeSponsorPlacard(s: Sponsor): THREE.Group {
  const g = new THREE.Group()
  const panelW = 0.6
  const panelH = 0.34
  const postH = 0.34
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, postH + panelH, 6), postMat)
  post.position.y = (postH + panelH) / 2
  post.castShadow = true
  g.add(post)
  const cy = postH + panelH / 2
  const frame = new THREE.Mesh(new THREE.BoxGeometry(panelW + 0.05, panelH + 0.05, 0.04), frameMat)
  frame.position.set(0, cy, 0)
  frame.castShadow = true
  const face = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), faceMaterial(s))
  face.position.set(0, cy, 0.026)
  g.add(frame, face)
  g.userData.sponsor = s.id
  return g
}

/** A flat banner mounted on a post in front of a house. */
export function makeSponsorBanner(s: Sponsor): THREE.Group {
  const g = new THREE.Group()
  const panelW = 0.5
  const panelH = 0.28
  const postH = 0.3
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, postH + panelH, 5), postMat)
  post.position.y = (postH + panelH) / 2
  post.castShadow = true
  const cy = postH + panelH / 2
  const frame = new THREE.Mesh(new THREE.BoxGeometry(panelW + 0.04, panelH + 0.04, 0.03), frameMat)
  frame.position.set(0, cy, 0)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), faceMaterial(s))
  face.position.set(0, cy, 0.02)
  g.add(post, frame, face)
  g.userData.sponsor = s.id
  return g
}
