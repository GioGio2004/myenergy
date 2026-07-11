// Procedural low-poly stand-ins (docs/03 §5: missing model → stylized primitive,
// never block on assets). One warm toon palette so everything matches.

import * as THREE from 'three'
import type { RegionDef } from '../../engine/data'
import { seedFromString, rngNext } from '../../engine/rng'

// ---------- shared toon materials (created once, reused everywhere) ----------
function toon(color: number): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color })
}

export const MAT = {
  wall: toon(0xf5e7c8),
  roof: toon(0xc4552f),
  wood: toon(0x8a5a3b),
  poleWhite: toon(0xf2ede1),
  nacelle: toon(0xd8d2c2),
  panel: toon(0x2b4a72),
  panelFrame: toon(0x9aa0a8),
  concrete: toon(0xb9b2a4),
  industrial: toon(0x7d7468),
  chimney: toon(0x5c554b),
  batteryBox: toon(0x4a7c59),
  batteryStripe: toon(0xf2a541),
  pylon: toon(0x6f6a5e),
  treeTrunk: toon(0x6e4a2f),
  tree1: toon(0x4c7a3f),
  tree2: toon(0x6a994e),
  rockDark: toon(0x6b5d52),
  windowOn: new THREE.MeshBasicMaterial({ color: 0xffd97a }),
  windowOff: new THREE.MeshBasicMaterial({ color: 0x2a2138 }),
  water: new THREE.MeshToonMaterial({ color: 0x74a4bc, transparent: true, opacity: 0.85 }),
  sea: new THREE.MeshToonMaterial({ color: 0x4f8aa8, transparent: true, opacity: 0.9 }),
  soil: toon(0x7a5f48),
  ghost: new THREE.MeshToonMaterial({ color: 0xd8cdb4, transparent: true, opacity: 0.45 }),
  marker: new THREE.MeshBasicMaterial({ color: 0xf2a541, transparent: true, opacity: 0.35 }),
}

// ---------- terrain ----------
export const TERRAIN_SIZE = 16

/** Deterministic slot → world position map (data.ts slot order:
 *  0-2 fields · 3-5 ridges · 6-8 rivers · 9 coast). */
export const SLOT_POS: Array<[number, number]> = [
  [-4.5, 1.5],
  [-2.4, 3.4],
  [-5.2, -1.4],
  [-4.0, -5.0],
  [-1.0, -5.2],
  [2.0, -5.0],
  [3.3, -3.2],
  [3.3, -0.2],
  [3.3, 2.8],
  [1.0, 6.9],
]

const RIVER_X = 3.3
const RIDGE_Z = -5

export function terrainHeight(x: number, z: number, coast: boolean, phase: number): number {
  // gentle rolling base
  let h = 0.22 + 0.14 * Math.sin(x * 0.7 + phase) * Math.cos(z * 0.6 + phase * 1.7)
  // back ridge
  h += 1.7 * Math.exp(-((z - RIDGE_Z) * (z - RIDGE_Z)) / 2.4)
  // river channel carved toward the front
  h -= 1.1 * Math.exp(-((x - RIVER_X) * (x - RIVER_X)) / 0.55)
  // coastal strip: front-right melts into the sea
  if (coast) {
    const s = THREE.MathUtils.smoothstep(z, 4.2, 6.5)
    h = THREE.MathUtils.lerp(h, -0.55, s)
  }
  return Math.max(h, -0.6)
}

export function makeTerrain(region: RegionDef): THREE.Group {
  const g = new THREE.Group()
  const seed = seedFromString(region.id)
  const phase = rngNext(seed).value * Math.PI * 2

  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 30, 30)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  // grass hue varies with the region's sun stat: sunny = warm, cloudy = lush/dark
  const sunny = region.sun / 9
  const grass = new THREE.Color().setHSL(0.26 - 0.03 * sunny, 0.42, 0.30 + 0.08 * sunny)
  const rock = new THREE.Color(0x8a7a68)
  const sand = new THREE.Color(0xd9c491)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const h = terrainHeight(x, z, region.coast, phase)
    pos.setY(i, h)
    if (h > 1.0) c.copy(rock).lerp(grass, THREE.MathUtils.clamp(1.6 - h, 0, 1))
    else if (h < 0.06) c.copy(sand)
    else c.copy(grass).offsetHSL(0, 0, (rngNext((i * 2654435761) >>> 0).value - 0.5) * 0.03)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  const terrain = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true }))
  terrain.name = 'terrain'
  g.add(terrain)

  // water table: fills the carved river bed (and the sea, on the coast)
  const water = new THREE.Mesh(new THREE.PlaneGeometry(TERRAIN_SIZE - 0.02, TERRAIN_SIZE - 0.02), region.coast ? MAT.sea : MAT.water)
  water.rotateX(-Math.PI / 2)
  water.position.y = -0.16
  g.add(water)

  // pedestal skirt — the "diorama on a table" look
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(TERRAIN_SIZE, 1.4, TERRAIN_SIZE), MAT.soil)
  skirt.position.y = -1.3
  g.add(skirt)

  // scattered trees on free land (deterministic per region)
  let word = seed
  for (let i = 0; i < 14; i++) {
    const a = rngNext(word)
    const b = rngNext(a.next)
    word = b.next
    const x = (a.value - 0.5) * (TERRAIN_SIZE - 4)
    const z = (b.value - 0.5) * (TERRAIN_SIZE - 4)
    if (Math.abs(x - RIVER_X) < 1.2) continue // not in the river
    if (region.coast && z > 3.8) continue // not in the sea
    const h = terrainHeight(x, z, region.coast, phase)
    if (h < 0.1 || h > 1.2) continue
    const tree = makeTree(i % 2 === 0)
    tree.position.set(x, h, z)
    g.add(tree)
  }
  return g
}

export function makeTree(alt: boolean): THREE.Group {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.3, 5), MAT.treeTrunk)
  trunk.position.y = 0.15
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 6), alt ? MAT.tree1 : MAT.tree2)
  crown.position.y = 0.65
  g.add(trunk, crown)
  const s = 0.8 + (alt ? 0.35 : 0)
  g.scale.setScalar(s)
  return g
}

// ---------- buildings ----------
export function makeHouse(withLight: boolean): THREE.Group {
  const g = new THREE.Group()
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.42, 0.5), MAT.wall)
  base.position.y = 0.21
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.34, 4), MAT.roof)
  roof.position.y = 0.59
  roof.rotation.y = Math.PI / 4
  g.add(base, roof)
  if (withLight) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.14), MAT.windowOn)
    win.name = 'window'
    win.position.set(0, 0.24, 0.251)
    g.add(win)
  }
  return g
}

/** Turbine; the blade group is named 'blades' for cosmetic spin. */
export function makeTurbine(scale = 1): THREE.Group {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 2.0, 6), MAT.poleWhite)
  pole.position.y = 1.0
  const nac = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.3), MAT.nacelle)
  nac.position.set(0, 2.0, 0.05)
  const blades = new THREE.Group()
  blades.name = 'blades'
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.85, 0.02), MAT.poleWhite)
    blade.position.y = 0.42
    const arm = new THREE.Group()
    arm.add(blade)
    arm.rotation.z = (i * Math.PI * 2) / 3
    blades.add(arm)
  }
  blades.position.set(0, 2.0, 0.22)
  g.add(pole, nac, blades)
  g.scale.setScalar(scale)
  return g
}

export function makeSolarArray(rows: number, cols: number): THREE.Group {
  const g = new THREE.Group()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), MAT.panel)
      panel.rotation.x = -0.42
      panel.position.set((c - (cols - 1) / 2) * 0.5, 0.18, (r - (rows - 1) / 2) * 0.42)
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.03), MAT.panelFrame)
      leg.position.set(panel.position.x, 0.08, panel.position.z)
      g.add(panel, leg)
    }
  }
  return g
}

export function makeDam(big: boolean): THREE.Group {
  const g = new THREE.Group()
  const w = big ? 2.4 : 1.7
  const h = big ? 1.1 : 0.7
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.35), MAT.concrete)
  wall.position.y = h / 2 - 0.35
  const crest = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.5), MAT.rockDark)
  crest.position.y = h - 0.35
  g.add(wall, crest)
  if (big) {
    const house = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), MAT.wall)
    house.position.set(w / 2 - 0.3, h - 0.15, 0)
    g.add(house)
  }
  return g
}

export function makeGasPeaker(): THREE.Group {
  const g = new THREE.Group()
  const hall = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), MAT.industrial)
  hall.position.y = 0.25
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.0, 6), MAT.chimney)
  stack.position.set(0.32, 0.75, 0.12)
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 8), MAT.concrete)
  tank.position.set(-0.35, 0.15, -0.28)
  g.add(hall, stack, tank)
  return g
}

export function makeBattery(): THREE.Group {
  const g = new THREE.Group()
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.35), MAT.batteryBox)
  box.position.y = 0.18
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.08, 0.37), MAT.batteryStripe)
  stripe.position.y = 0.22
  g.add(box, stripe)
  return g
}

export function makePylon(): THREE.Group {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.5, 5), MAT.pylon)
  pole.position.y = 0.75
  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), MAT.pylon)
  arm1.position.y = 1.35
  const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), MAT.pylon)
  arm2.position.y = 1.15
  g.add(pole, arm1, arm2)
  return g
}

export function makeSlotMarker(): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.4, 24), MAT.marker)
  m.rotateX(-Math.PI / 2)
  return m
}
