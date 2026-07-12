// Procedural low-poly stand-ins (docs/03 §5: missing model → stylized primitive,
// never block on assets). One warm toon palette so everything matches.

import * as THREE from 'three'
import type { RegionDef } from '../../engine/data'
import type { RegionId } from '../../engine/types'
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
  // Premium foliage ported from the Terrain reference: flat-shaded standard
  // materials give crisp low-poly facets + soft roughness gradients (nicer than
  // toon's hard cel bands for natural greenery). Dedicated mats so citizens etc.
  // that reuse tree1/tree2 are untouched.
  treeBark: new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9, flatShading: true }),
  // two tonal shades per crown type so the forest reads with depth, not one flat green
  pine: new THREE.MeshStandardMaterial({ color: 0x2c5a34, roughness: 0.85, flatShading: true }),
  pine2: new THREE.MeshStandardMaterial({ color: 0x37693c, roughness: 0.85, flatShading: true }),
  treeRound: new THREE.MeshStandardMaterial({ color: 0x4a7a3c, roughness: 0.85, flatShading: true }),
  treeRound2: new THREE.MeshStandardMaterial({ color: 0x5d8c46, roughness: 0.85, flatShading: true }),
  rockDark: new THREE.MeshStandardMaterial({ color: 0x6b6258, roughness: 0.95, flatShading: true }),
  rockLight: new THREE.MeshStandardMaterial({ color: 0x847c6e, roughness: 0.95, flatShading: true }), // rock→cream 0.25
  // Premium village houses (ported from the DENI asset lab): flat-shaded standard to
  // match the terrain. cream walls, terracotta roofs, bark trim, rock chimneys.
  houseWall: new THREE.MeshStandardMaterial({ color: 0xf5e7c8, roughness: 0.9, flatShading: true }),
  houseRoof: new THREE.MeshStandardMaterial({ color: 0xc4552f, roughness: 0.9, flatShading: true }),
  // glossy solar glass (ported look) — catches a sun glint like the premium water
  solarPanel: new THREE.MeshStandardMaterial({ color: 0x2f6fa8, roughness: 0.25, metalness: 0.35, flatShading: true }),
  windowOn: new THREE.MeshBasicMaterial({ color: 0xffd97a }),
  windowOff: new THREE.MeshBasicMaterial({ color: 0x2a2138 }),
  // Glossy teal water: low roughness + a little metalness gives a sun glint, faint
  // emissive keeps it reading as water in shade. depthWrite:false stops the
  // transparent table from z-fighting/shimmering against the waterline on orbit.
  water: new THREE.MeshStandardMaterial({ color: 0x2f8fa8, roughness: 0.16, metalness: 0.35, emissive: 0x0b3d47, emissiveIntensity: 0.35, transparent: true, opacity: 0.85, depthWrite: false }),
  sea: new THREE.MeshStandardMaterial({ color: 0x2b7fa0, roughness: 0.12, metalness: 0.45, emissive: 0x0a3a48, emissiveIntensity: 0.35, transparent: true, opacity: 0.9, depthWrite: false }),
  soil: toon(0x7a5f48),
  ghost: new THREE.MeshToonMaterial({ color: 0xd8cdb4, transparent: true, opacity: 0.45 }),
  // construction-site kit: orange safety cones, amber hazard tape, steel rebar,
  // and bright unlit ETA pips that read at a glance even against a dark blackout.
  cone: new THREE.MeshStandardMaterial({ color: 0xf0752a, roughness: 0.55, flatShading: true }),
  coneStripe: new THREE.MeshBasicMaterial({ color: 0xf7f0e2, toneMapped: false }),
  hazard: new THREE.MeshBasicMaterial({ color: 0xf2a541, toneMapped: false }),
  rebar: new THREE.MeshStandardMaterial({ color: 0x8a8272, roughness: 0.7, metalness: 0.3, flatShading: true }),
  etaDone: new THREE.MeshBasicMaterial({ color: 0x77e38b, toneMapped: false }),
  etaPending: new THREE.MeshBasicMaterial({ color: 0xf2a541, toneMapped: false }),
  markerAvailable: new THREE.MeshBasicMaterial({ color: 0x77e38b, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
  // Beacon draws OVER terrain/water (depthTest:false) so a slot is never half-hidden
  // behind a hill or the river — the "tap here" affordance.
  beacon: new THREE.MeshBasicMaterial({ color: 0x9dffb4, toneMapped: false, transparent: true, opacity: 0.96, depthTest: false }),
  markerOccupied: new THREE.MeshBasicMaterial({ color: 0x9c98a8, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  // translucent fills give the whole circle a hit target, not just the ring
  markerFill: new THREE.MeshBasicMaterial({ color: 0x77e38b, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false }),
  markerFillOcc: new THREE.MeshBasicMaterial({ color: 0x9c98a8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
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

export const RIVER_X = 3.3
export const RIDGE_Z = -5

// Per-region terrain "character" so no two regions read the same: ridge height,
// rolling amplitude, river depth, ridge spread, and a grass/rock/sand palette.
export interface TerrainProfile {
  coast: boolean
  ridgeH: number
  ridgeSpread: number
  amp: number
  riverDepth: number
  grass: number
  rock: number
  sand: number
}

const REGION_TERRAIN: Record<RegionId, Omit<TerrainProfile, 'coast'>> = {
  // sunny wine valley — low golden hills, gentle river
  kakheti:   { ridgeH: 1.05, ridgeSpread: 3.0, amp: 0.18, riverDepth: 0.75, grass: 0x9a9a45, rock: 0x9c8a66, sand: 0xd9c491 },
  // open windy plain (Gori) — flat, wide
  kartli:    { ridgeH: 1.25, ridgeSpread: 3.4, amp: 0.10, riverDepth: 0.85, grass: 0x7f9a4e, rock: 0x93876c, sand: 0xd6c79a },
  // high cold plateau — broad tableland, shallow water
  javakheti: { ridgeH: 2.0,  ridgeSpread: 4.6, amp: 0.09, riverDepth: 0.45, grass: 0x5f7d4a, rock: 0x8a8474, sand: 0xc9c19a },
  // lush green gorge (Namakhvani) — deep river cut
  imereti:   { ridgeH: 1.6,  ridgeSpread: 2.2, amp: 0.17, riverDepth: 1.45, grass: 0x3f8f45, rock: 0x7c7358, sand: 0xcdb98a },
  // steep mountains, powerful rivers
  racha:     { ridgeH: 2.7,  ridgeSpread: 1.9, amp: 0.22, riverDepth: 1.35, grass: 0x3d7d48, rock: 0x726456, sand: 0xbfae86 },
  // subtropical coast — green, sea in front
  adjara:    { ridgeH: 1.5,  ridgeSpread: 2.4, amp: 0.16, riverDepth: 0.6,  grass: 0x2f8a4e, rock: 0x77705a, sand: 0xe4d3a0 },
  // cloudy coastal lowland — flat, humid
  samegrelo: { ridgeH: 0.8,  ridgeSpread: 3.2, amp: 0.12, riverDepth: 0.8,  grass: 0x46804f, rock: 0x807761, sand: 0xdccaa0 },
}

export function getTerrainProfile(region: RegionDef): TerrainProfile {
  return { coast: region.coast, ...REGION_TERRAIN[region.id] }
}

// Deterministic 2D value-noise + fbm, ported from the Terrain reference. Used to
// give the ground moisture-driven color variation and per-facet jitter so it reads
// as a rich natural surface rather than three flat color bands.
function makeNoise2D(seed: number) {
  const s = (seed * 2654435761) >>> 0
  const hash = (ix: number, iz: number) => {
    let h = (ix * 374761393 + iz * 668265263 + s) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
  const smooth = (t: number) => t * t * (3 - 2 * t)
  return (x: number, z: number) => {
    const ix = Math.floor(x)
    const iz = Math.floor(z)
    const fx = x - ix
    const fz = z - iz
    const a = hash(ix, iz)
    const b = hash(ix + 1, iz)
    const c = hash(ix, iz + 1)
    const d = hash(ix + 1, iz + 1)
    const u = smooth(fx)
    const v = smooth(fz)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
}

function makeFbm(seed: number) {
  const n = makeNoise2D(seed)
  return (x: number, z: number, octaves = 4) => {
    let amp = 0.5
    let freq = 1
    let sum = 0
    let norm = 0
    for (let i = 0; i < octaves; i++) {
      sum += n(x * freq, z * freq) * amp
      norm += amp
      amp *= 0.5
      freq *= 2.1
    }
    return sum / norm
  }
}

export function terrainHeight(x: number, z: number, p: TerrainProfile, phase: number): number {
  // gentle rolling base (amplitude varies per region)
  let h = 0.22 + p.amp * Math.sin(x * 0.7 + phase) * Math.cos(z * 0.6 + phase * 1.7)
  // back ridge — height and spread give each region its own skyline
  h += p.ridgeH * Math.exp(-((z - RIDGE_Z) * (z - RIDGE_Z)) / p.ridgeSpread)
  // river channel carved toward the front
  h -= p.riverDepth * Math.exp(-((x - RIVER_X) * (x - RIVER_X)) / 0.55)
  // coastal strip: front-right melts into the sea
  if (p.coast) {
    const s = THREE.MathUtils.smoothstep(z, 4.2, 6.5)
    h = THREE.MathUtils.lerp(h, -0.55, s)
  }
  return Math.max(h, -0.6)
}

export function makeTerrain(region: RegionDef): THREE.Group {
  const g = new THREE.Group()
  const seed = seedFromString(region.id)
  const phase = rngNext(seed).value * Math.PI * 2
  const profile = getTerrainProfile(region)

  // Higher-res plane displaced by the region heightmap. Rendered as crisp
  // low-poly facets: toNonIndexed() + one flat color per triangle + a flat-shaded
  // MeshStandardMaterial (technique ported from the Terrain reference for a more
  // premium ground than the old smooth toon shading).
  const base = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 48, 48)
  base.rotateX(-Math.PI / 2)
  const bp = base.attributes.position
  for (let i = 0; i < bp.count; i++) {
    bp.setY(i, terrainHeight(bp.getX(i), bp.getZ(i), profile, phase))
  }
  const geo = base.toNonIndexed()
  base.dispose()

  // each region carries its own grass/rock/sand palette (set in REGION_TERRAIN)
  const grass = new THREE.Color(profile.grass)
  const rock = new THREE.Color(profile.rock)
  const sand = new THREE.Color(profile.sand)
  const snow = new THREE.Color(0xeef2f6)
  const moisture = makeFbm(seed + 202)
  const c = new THREE.Color()
  const p = geo.attributes.position
  const colors = new Float32Array(p.count * 3)
  for (let f = 0; f < p.count; f += 3) {
    // face centroid → one color for the whole triangle (flat facets)
    const cx = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3
    const cy = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3
    const cz = (p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)) / 3
    const m = moisture(cx * 0.18 + 200, cz * 0.18 + 200, 3) // 0..1 wetness
    const jitter = (moisture(cx * 1.4 + 400, cz * 1.4 + 400, 2) - 0.5) * 0.05
    if (cy < 0.06) {
      c.copy(sand)
    } else if (cy < 1.0) {
      // lush grassland: stays green everywhere — moisture only nudges hue/sat/
      // lightness (wetter = deeper green, drier = a touch olive), never bald dirt.
      c.copy(grass).offsetHSL((0.5 - m) * 0.03, (m - 0.5) * 0.12, (m - 0.5) * 0.05 + jitter)
    } else if (cy < 1.7) {
      // grass melting into rock up the slope
      c.copy(grass).lerp(rock, THREE.MathUtils.clamp((cy - 1.0) / 0.7, 0, 1))
      c.offsetHSL(0, 0, jitter)
    } else {
      // rocky peaks capped with snow (only the tall regions reach here)
      c.copy(rock).lerp(snow, THREE.MathUtils.clamp((cy - 1.7) / 0.8, 0, 1))
    }
    for (let v = 0; v < 3; v++) {
      colors[(f + v) * 3] = c.r
      colors[(f + v) * 3 + 1] = c.g
      colors[(f + v) * 3 + 2] = c.b
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.94, metalness: 0.04 }),
  )
  terrain.name = 'terrain'
  terrain.receiveShadow = true
  g.add(terrain)

  // water table: fills the carved river bed (and the sea, on the coast).
  // renderOrder + depthWrite:false (on the material) keep it from shimmering
  // against the terrain waterline while the camera moves.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(TERRAIN_SIZE - 0.02, TERRAIN_SIZE - 0.02), region.coast ? MAT.sea : MAT.water)
  water.name = 'water'
  water.rotateX(-Math.PI / 2)
  water.position.y = -0.16
  water.renderOrder = 2
  g.add(water)

  // pedestal skirt — the "diorama on a table" look
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(TERRAIN_SIZE, 1.4, TERRAIN_SIZE), MAT.soil)
  skirt.position.y = -1.3
  g.add(skirt)

  // Forests: dense clustered tree cover (ported feel from the Terrain reference —
  // stands + clearings via forest noise, climbing the slopes, pine-heavy up high),
  // replacing the old sparse 14-tree scatter that read as empty.
  const forest = makeFbm(seed + 303)
  let word = seed
  let placed = 0
  for (let i = 0; i < 1100 && placed < 90; i++) {
    const a = rngNext(word)
    const b = rngNext(a.next)
    const cc = rngNext(b.next)
    word = cc.next
    const x = (a.value - 0.5) * (TERRAIN_SIZE - 3)
    const z = (b.value - 0.5) * (TERRAIN_SIZE - 3)
    if (Math.abs(x - RIVER_X) < 1.1) continue // not in the river
    if (region.coast && z > 3.6) continue // not in the sea
    if (z > -0.5 && z < 2.05 && x > -3.95 && x < 2.5) continue // clear of the ring road + crown margin
    if (Math.hypot(x + 0.6, z + 0.6) < 2.6) continue // not inside the village core
    if (SLOT_POS.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 1.1)) continue // keep build pads clear
    const h = terrainHeight(x, z, profile, phase)
    if (h < 0.12 || h > 2.2) continue // off the water, off the snow line
    // cluster into forest stands (with bare clearings) rather than even scatter
    if (forest(x * 0.28 + 40, z * 0.28 + 40, 3) < 0.5) continue
    // broadleaf (round) only lower down; ridges are pine
    const round = h <= 1.0 && cc.value > 0.55
    const tree = makeTree(round, a.value > 0.5)
    tree.position.set(x, h, z)
    tree.rotation.y = cc.value * Math.PI * 2
    g.add(tree)
    placed++
  }

  // Rocks on the high peaks (reference detail — breaks up bare mountain tops).
  let rword = rngNext(seed + 777).next
  let rocks = 0
  for (let i = 0; i < 300 && rocks < 20; i++) {
    const a = rngNext(rword)
    const b = rngNext(a.next)
    const cc = rngNext(b.next)
    rword = cc.next
    const x = (a.value - 0.5) * (TERRAIN_SIZE - 3)
    const z = (b.value - 0.5) * (TERRAIN_SIZE - 3)
    const h = terrainHeight(x, z, profile, phase)
    if (h < 1.4) continue // peaks only
    const rock = makeRock(rocks, 0.34 + cc.value * 0.28)
    rock.position.set(x, h - 0.03, z)
    rock.rotation.y = a.value * 6
    g.add(rock)
    rocks++
  }
  return g
}

/** Two crown shapes ported from the Terrain reference: a tapered pine (cone) and
 *  a rounded broadleaf (faceted icosahedron), both flat-shaded for the premium
 *  low-poly look. `round` picks the broadleaf; `dark` picks the deeper of two
 *  tonal shades so a forest reads with depth. */
export function makeTree(round: boolean, dark = false): THREE.Group {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.3, 5), MAT.treeBark)
  trunk.position.y = 0.15
  trunk.castShadow = true
  const crownMat = round ? (dark ? MAT.treeRound : MAT.treeRound2) : (dark ? MAT.pine : MAT.pine2)
  const crown = round
    ? new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), crownMat)
    : new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 6), crownMat)
  crown.position.y = round ? 0.62 : 0.68
  crown.castShadow = true
  g.add(trunk, crown)
  const s = 0.8 + (round ? 0.35 : 0)
  g.scale.setScalar(s)
  return g
}

/** Low-poly boulder cluster for the high peaks (3 designs ported from the asset lab). */
export function makeRock(variant: number, scale: number): THREE.Group {
  const g = new THREE.Group()
  const boulder = (geo: THREE.BufferGeometry, x: number, y: number, z: number, light: boolean, sq = 1, rot?: [number, number, number]) => {
    const m = new THREE.Mesh(geo, light ? MAT.rockLight : MAT.rockDark)
    m.position.set(x, y, z)
    m.scale.set(1, sq, 1)
    if (rot) m.rotation.set(rot[0], rot[1], rot[2])
    m.castShadow = true
    g.add(m)
  }
  const ico = (r: number) => new THREE.IcosahedronGeometry(r, 0)
  const dod = (r: number) => new THREE.DodecahedronGeometry(r, 0)
  switch (variant % 3) {
    case 0: // monolith
      boulder(ico(0.42), 0, 0.34, 0, false, 1.15, [0.2, 0.5, 0.1])
      boulder(ico(0.26), -0.38, 0.2, 0.14, true, 1, [0, 1.2, 0.3])
      boulder(ico(0.22), 0.36, 0.16, -0.1, false, 1, [0.4, 0.2, 0])
      break
    case 1: // scree
      boulder(ico(0.28), 0, 0.22, 0, false, 1, [0.1, 0.8, 0.2])
      ;[[-0.45, 0.25, 0.16, 1], [0.42, 0.3, 0.17, 0], [0.5, -0.25, 0.16, 1], [-0.3, -0.42, 0.18, 0], [0.05, 0.52, 0.16, 0], [-0.55, -0.1, 0.16, 1]].forEach(([x, z, r, l], i) =>
        boulder(ico(r), x, r * 0.55, z, l === 1, 0.7, [0, i * 0.9, 0]),
      )
      break
    default: // sheared (dodecahedra)
      boulder(dod(0.36), 0, 0.3, 0, false, 1, [0.12, 0.4, 0.28])
      boulder(dod(0.26), -0.3, 0.18, 0.2, true, 0.6, [0.3, 1.1, 0.5])
      boulder(dod(0.22), 0.34, 0.14, -0.18, false, 0.55, [0.5, 0.2, 0.9])
      break
  }
  g.scale.setScalar(scale)
  return g
}

// ---------- buildings ----------
// Three Georgian-cottage designs (ported from the DENI asset lab). The lit-window
// PANE is named 'window' so the diorama's blackout toggle can still darken it.
export function makeHouse(withLight: boolean, variant = 0): THREE.Group {
  const g = new THREE.Group()
  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, rot?: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z)
    if (rot) m.rotation.set(rot[0], rot[1], rot[2])
    m.castShadow = true
    g.add(m)
    return m
  }
  const roofCone = (h: number, y: number) => {
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.48, h, 4), MAT.houseRoof)
    r.position.y = y + h / 2
    r.rotation.y = Math.PI / 4
    r.castShadow = true
    g.add(r)
  }
  const chimney = (x: number, y: number) => {
    box(0.09, 0.22, 0.09, MAT.rockDark, x, y, -0.1)
    box(0.12, 0.04, 0.12, MAT.chimney, x, y + 0.13, -0.1)
  }
  const litWindow = (x: number, y: number, z: number) => {
    box(0.14, 0.16, 0.02, MAT.treeBark, x, y, z) // frame
    const pane = box(0.1, 0.12, 0.02, withLight ? MAT.windowOn : MAT.windowOff, x, y, z + 0.006)
    pane.name = 'window'
  }
  // shared walls
  box(0.6, 0.42, 0.5, MAT.houseWall, 0, 0.21, 0)
  switch (variant % 3) {
    case 0: // steep
      roofCone(0.46, 0.42)
      chimney(0.17, 0.66)
      box(0.13, 0.24, 0.02, MAT.treeBark, -0.14, 0.12, 0.251) // door
      litWindow(0.15, 0.24, 0.251)
      break
    case 1: // porch
      roofCone(0.26, 0.42)
      box(0.13, 0.24, 0.02, MAT.treeBark, 0, 0.12, 0.251) // door
      litWindow(0.19, 0.26, 0.251)
      box(0.5, 0.05, 0.22, MAT.treeBark, 0, 0.025, 0.36) // deck
      box(0.54, 0.03, 0.26, MAT.houseRoof, 0, 0.4, 0.37, [0.28, 0, 0]) // awning
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.34, 5), MAT.treeBark)
        post.position.set(s * 0.21, 0.21, 0.44)
        post.castShadow = true
        g.add(post)
      }
      break
    default: // lean-to
      roofCone(0.34, 0.42)
      chimney(-0.15, 0.62)
      box(0.13, 0.24, 0.02, MAT.treeBark, 0.16, 0.12, 0.251) // door
      litWindow(-0.14, 0.26, 0.251)
      box(0.24, 0.26, 0.34, MAT.houseWall, 0.42, 0.13, 0) // annex
      box(0.3, 0.03, 0.38, MAT.houseRoof, 0.42, 0.29, 0, [0, 0, -0.32]) // annex roof
      litWindow(0.42, 0.14, 0.171)
      break
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
  // amber rotor hub (ported detail) — spins with the blades
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), MAT.batteryStripe)
  hub.position.y = 0
  blades.add(hub)
  blades.position.set(0, 2.0, 0.22)
  g.add(pole, nac, blades)
  g.scale.setScalar(scale)
  return g
}

export function makeSolarArray(rows: number, cols: number): THREE.Group {
  const g = new THREE.Group()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), MAT.solarPanel)
      panel.rotation.x = -0.42
      panel.castShadow = true
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

export type ConstructionSize = 'small' | 'medium' | 'large'

// A readable "under construction" site: fenced dirt pad with hazard tape + safety
// cones, a scaffold cage around a concrete shell that RISES with progress, a
// rotating tower crane whose hook hangs from a real cable (the jib is named
// 'crane' so the diorama slews it), and a floating row of ETA pips above — one per
// build-quarter, green = poured, amber = still to go — so "N quarters left" reads
// at a glance without opening anything. Bigger buildables get a bigger site.
const CONSTRUCTION_DIMS: Record<ConstructionSize, { pad: number; mast: number; jib: number; struct: number }> = {
  small: { pad: 0.55, mast: 1.05, jib: 0.72, struct: 0.44 },
  medium: { pad: 0.92, mast: 1.55, jib: 1.12, struct: 0.76 },
  large: { pad: 1.35, mast: 2.15, jib: 1.7, struct: 1.18 },
}

function makeCone(scale: number): THREE.Group {
  const c = new THREE.Group()
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 10), MAT.cone)
  body.position.y = 0.08
  body.castShadow = true
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.14), MAT.cone)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.03, 10), MAT.coneStripe)
  band.position.y = 0.075
  c.add(base, body, band)
  c.scale.setScalar(scale)
  return c
}

export function makeConstructionSite(size: ConstructionSize, totalTurns: number, turnsLeft: number): THREE.Group {
  const d = CONSTRUCTION_DIMS[size]
  const total = Math.max(1, totalTurns)
  const left = Math.max(0, Math.min(total, turnsLeft))
  const done = total - left
  const p = Math.max(0.08, Math.min(1, (done + 0.35) / total)) // shell height: some progress even on day one
  const g = new THREE.Group()
  const half = d.pad // scaffold/pad half-extent

  // dirt pad
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(d.pad * 1.15, d.pad * 1.2, 0.08, 14), MAT.soil)
  pad.position.y = 0.04
  pad.receiveShadow = true
  g.add(pad)

  // hazard-tape barrier ring at the pad edge — universal "keep out, work zone"
  const tape = new THREE.Mesh(new THREE.TorusGeometry(d.pad * 1.12, 0.022, 6, 24), MAT.hazard)
  tape.rotation.x = -Math.PI / 2
  tape.position.y = 0.17
  g.add(tape)

  // foundation slab + the concrete shell rising out of it (height ∝ progress)
  const slab = new THREE.Mesh(new THREE.BoxGeometry(half * 1.5, 0.08, half * 1.5), MAT.concrete)
  slab.position.y = 0.11
  slab.receiveShadow = true
  g.add(slab)
  const sh = d.struct * p
  const shell = new THREE.Mesh(new THREE.BoxGeometry(half * 1.15, sh, half * 1.15), MAT.concrete)
  shell.position.y = 0.15 + sh / 2
  shell.castShadow = true
  g.add(shell)
  // exposed rebar sprouting from the top of the poured level
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 4), MAT.rebar)
    bar.position.set(sx * half * 0.5, 0.15 + sh + 0.09, sz * half * 0.5)
    g.add(bar)
  }

  // scaffold cage: 4 corner poles joined by horizontal cross-bars at two heights
  const scaffH = d.mast * 0.62
  const corners: Array<[number, number]> = [[-half, -half], [half, -half], [half, half], [-half, half]]
  for (const [cx, cz] of corners) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, scaffH, 5), MAT.pylon)
    pole.position.set(cx, scaffH / 2 + 0.08, cz)
    pole.castShadow = true
    g.add(pole)
  }
  for (let c = 0; c < 4; c++) {
    const [ax, az] = corners[c]
    const [bx, bz] = corners[(c + 1) % 4]
    for (const ry of [scaffH * 0.5, scaffH]) {
      const len = Math.hypot(bx - ax, bz - az)
      const bar = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, 0.02), MAT.pylon)
      bar.position.set((ax + bx) / 2, ry + 0.08, (az + bz) / 2)
      bar.rotation.y = Math.atan2(bx - ax, bz - az) + Math.PI / 2
      g.add(bar)
    }
  }

  // safety cones around the pad
  const cones = size === 'large' ? 5 : 3
  for (let i = 0; i < cones; i++) {
    const ang = (i / cones) * Math.PI * 2 + 0.4
    const cone = makeCone(size === 'small' ? 0.85 : 1.1)
    cone.position.set(Math.cos(ang) * d.pad * 1.12, 0.08, Math.sin(ang) * d.pad * 1.12)
    g.add(cone)
  }

  // tower crane in a back corner: mast + slewing jib (named 'crane') + cabled hook
  const mx = -d.pad * 0.75
  const mz = -d.pad * 0.75
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, d.mast, 6), MAT.industrial)
  mast.position.set(mx, d.mast / 2, mz)
  mast.castShadow = true
  g.add(mast)
  const jib = new THREE.Group()
  jib.name = 'crane'
  jib.position.set(mx, d.mast, mz)
  const arm = new THREE.Mesh(new THREE.BoxGeometry(d.jib, 0.05, 0.06), MAT.batteryStripe)
  arm.position.x = d.jib * 0.3
  jib.add(arm)
  const counter = new THREE.Mesh(new THREE.BoxGeometry(d.jib * 0.42, 0.05, 0.06), MAT.industrial)
  counter.position.x = -d.jib * 0.24
  const cWeight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), MAT.concrete)
  cWeight.position.set(-d.jib * 0.42, -0.02, 0)
  jib.add(counter, cWeight)
  // hook on a real cable near the far end of the jib (fixes the "floating cube")
  const hookX = d.jib * 0.6
  const cableLen = 0.2 + (1 - p) * (d.mast * 0.45)
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, cableLen, 4), MAT.rebar)
  cable.position.set(hookX, -cableLen / 2, 0)
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.11), MAT.concrete)
  hook.position.set(hookX, -cableLen - 0.04, 0)
  hook.castShadow = true
  jib.add(cable, hook)
  g.add(jib)

  // floating ETA pips above the site — one per build-quarter (green done / amber left)
  const pipRow = new THREE.Group()
  const gap = 0.19
  const startX = -((total - 1) * gap) / 2
  for (let i = 0; i < total; i++) {
    const pip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), i < done ? MAT.etaDone : MAT.etaPending)
    pip.position.x = startX + i * gap
    pipRow.add(pip)
  }
  pipRow.position.set(0, d.mast + 0.55, 0)
  g.add(pipRow)

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

/** A placement marker: a bright ring PLUS a translucent filled disc so the whole
 *  circle (not just the thin ring) is a click target — fixes the "only the green
 *  edge is clickable" bug. Returns a Group; callers set userData on the group. */
export function makeSlotMarker(available = true): THREE.Group {
  const g = new THREE.Group()
  const fill = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), available ? MAT.markerFill : MAT.markerFillOcc)
  fill.rotateX(-Math.PI / 2)
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.54, 28), available ? MAT.markerAvailable : MAT.markerOccupied)
  ring.rotateX(-Math.PI / 2)
  ring.position.y = 0.002
  g.add(fill, ring)
  if (available) {
    // Floating beacon (named 'beacon' so the diorama bobs/pulses it): a light beam
    // + a downward pin that hovers over the slot and always renders on top.
    const beacon = new THREE.Group()
    beacon.name = 'beacon'
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), MAT.beacon)
    beam.position.y = 0.55
    beam.renderOrder = 999
    const pin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.26, 6), MAT.beacon)
    pin.position.y = 0.9
    pin.rotation.x = Math.PI // point the tip down at the slot
    pin.renderOrder = 999
    beacon.add(beam, pin)
    g.add(beacon)
  }
  return g
}

// ---------- sky ----------
const SKY_RADIUS = 60

/** A large inward-facing dome behind the whole diorama. Vertex-colored with a
 *  zenith→horizon gradient (repainted per season) so the backdrop reads as real
 *  sky instead of a flat fill; fog blends the scene into its horizon band. */
export function makeSkyDome(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(SKY_RADIUS, 24, 16)
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  )
  mesh.name = 'sky'
  mesh.renderOrder = -1
  return mesh
}

/** Repaint the dome gradient. `horizon` should match the scene fog color so the
 *  ground fades seamlessly into the sky. */
export function paintSky(mesh: THREE.Mesh, zenith: number, horizon: number): void {
  const geo = mesh.geometry as THREE.SphereGeometry
  const pos = geo.attributes.position
  const zc = new THREE.Color(zenith)
  const hc = new THREE.Color(horizon)
  const c = new THREE.Color()
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    // y ∈ [-R, R] → 0..1, eased so the horizon band stays tight near the ground
    const t = THREE.MathUtils.clamp(pos.getY(i) / SKY_RADIUS, -1, 1) * 0.5 + 0.5
    c.copy(hc).lerp(zc, Math.pow(t, 0.55))
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}
