// 3D sponsor billboards — the "banner" look, placed around the EDGES of the
// diorama (see PERIMETER_ANCHORS in diorama.ts) so they frame the scene instead
// of cluttering the middle. Each board prefers a REAL logo image dropped at
// public/sponsors/<id>.png (composited onto a clean white card so any logo reads
// undistorted); until that asset exists it falls back to a styled brand-name
// plaque. Boards are clickable (userData.sponsor → diorama raycast → info card).

import * as THREE from 'three'
import { SPONSORS, sponsorLogoUrl, type Sponsor } from '../sponsors'

const PANEL_W = 1.25
const PANEL_H = 0.72
const POST_H = 0.6
const TEX_W = 512
const TEX_H = Math.round((TEX_W * PANEL_H) / PANEL_W) // keep canvas aspect == panel aspect

const postMat = new THREE.MeshStandardMaterial({ color: 0x5b4d3c, roughness: 0.85, flatShading: true })
const frameMat = new THREE.MeshStandardMaterial({ color: 0x241f2e, roughness: 0.8, flatShading: true })
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

/** Styled brand-name plaque (fallback until a real logo image exists). */
function plaqueCanvas(s: Sponsor): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!
  const bg = new THREE.Color(s.color)
  const ink = s.light ? '#241a12' : '#ffffff'
  const sub = s.light ? 'rgba(36,26,18,0.6)' : 'rgba(255,255,255,0.72)'
  const m = 16
  roundRect(ctx, m, m, TEX_W - m * 2, TEX_H - m * 2, 26)
  ctx.fillStyle = `#${bg.getHexString()}`
  ctx.fill()
  ctx.lineWidth = 7
  ctx.strokeStyle = s.light ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.24)'
  roundRect(ctx, m + 9, m + 9, TEX_W - (m + 9) * 2, TEX_H - (m + 9) * 2, 20)
  ctx.stroke()
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const words = s.name.split(' ')
  const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [s.name]
  const maxW = TEX_W - m * 2 - 44
  let size = lines.length > 1 ? 58 : 84
  const fit = (px: number) => {
    ctx.font = `800 ${px}px "Helvetica Neue", Arial, sans-serif`
    return Math.max(...lines.map((l) => ctx.measureText(l).width))
  }
  while (fit(size) > maxW && size > 24) size -= 3
  const lh = size * 1.05
  const cy = TEX_H / 2 + 2 - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, TEX_W / 2, cy + i * lh))
  ctx.fillStyle = sub
  ctx.font = `700 22px "Helvetica Neue", Arial, sans-serif`
  ctx.fillText('MyEnerge partner', TEX_W / 2, TEX_H - m - 22)
  return canvas
}

/** Composite a loaded logo image, contained + centered, onto a clean white card.
 *  `crop` (fractional [x,y,w,h] of the source) isolates part of a logo — used to
 *  show GITA's colored mark instead of its white-on-transparent wordmark. */
function logoCanvas(img: HTMLImageElement, crop?: [number, number, number, number]): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!
  const m = 14
  roundRect(ctx, m, m, TEX_W - m * 2, TEX_H - m * 2, 22)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  // source sub-rect (whole image by default)
  const sx = crop ? crop[0] * img.width : 0
  const sy = crop ? crop[1] * img.height : 0
  const sw = crop ? crop[2] * img.width : img.width
  const sh = crop ? crop[3] * img.height : img.height
  // contain within a padded inner box, preserving aspect ratio
  const padX = 44
  const padY = 38
  const boxW = TEX_W - padX * 2
  const boxH = TEX_H - padY * 2
  const scale = Math.min(boxW / sw, boxH / sh)
  const w = sw * scale
  const h = sh * scale
  ctx.drawImage(img, sx, sy, sw, sh, (TEX_W - w) / 2, (TEX_H - h) / 2, w, h)
  return canvas
}

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Shared unlit face material per sponsor. Starts as the name plaque, then
 *  upgrades to the real logo the moment public/sponsors/<id>.png is available. */
function faceMaterial(s: Sponsor): THREE.MeshBasicMaterial {
  const cached = faceMatCache.get(s.id)
  if (cached) return cached
  const mat = new THREE.MeshBasicMaterial({ map: makeTexture(plaqueCanvas(s)), side: THREE.DoubleSide, toneMapped: false })
  faceMatCache.set(s.id, mat)
  const url = sponsorLogoUrl(s)
  if (url) {
    // Load the real logo and composite it onto a clean card; keep the plaque on failure.
    const img = new Image()
    img.onload = () => {
      mat.map?.dispose()
      mat.map = makeTexture(logoCanvas(img, s.logoCrop))
      mat.needsUpdate = true
    }
    img.src = url // same-origin (public/) → canvas stays untainted
  }
  return mat
}

/** A billboard: two posts holding a framed panel. Base at y=0; faces local +Z. */
export function makeSponsorBoard(s: Sponsor, scale = 1): THREE.Group {
  const g = new THREE.Group()
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, POST_H + PANEL_H, 6), postMat)
    post.position.set(sx * PANEL_W * 0.42, (POST_H + PANEL_H) / 2, 0)
    post.castShadow = true
    g.add(post)
  }
  const cy = POST_H + PANEL_H / 2
  const frame = new THREE.Mesh(new THREE.BoxGeometry(PANEL_W + 0.09, PANEL_H + 0.09, 0.06), frameMat)
  frame.position.set(0, cy, 0)
  frame.castShadow = true
  const face = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), faceMaterial(s))
  face.position.set(0, cy, 0.036)
  g.add(frame, face)
  g.scale.setScalar(scale)
  g.traverse((o) => (o.userData.sponsor = s.id)) // whole board is one click target
  return g
}

export { SPONSORS }
