// Imperative Three.js living diorama. V2 deliberately makes construction plots
// and built assets interactive; all clicks still dispatch through the pure engine.

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { cityStats, seasonOf } from '../../engine/engine'
import { BUILDABLES, regionById } from '../../engine/data'
import type { GameState, RegionId, Season } from '../../engine/types'
import type { PlacementMode } from '../../store'
import {
  MAT,
  SLOT_POS,
  makeBattery,
  makeDam,
  makeGasPeaker,
  makeHouse,
  makePylon,
  makeSkyDome,
  makeSlotMarker,
  makeSolarArray,
  makeTerrain,
  makeTurbine,
  paintSky,
  terrainHeight,
  getTerrainProfile,
  RIVER_X,
} from './assets'
import { seedFromString, rngNext } from '../../engine/rng'

// Horizon band (also the fog color) per season.
const SKY: Record<Season, number> = {
  spring: 0x8fb8c9,
  summer: 0x9cc4d4,
  autumn: 0xc9a98f,
  winter: 0x9aa5b5,
}
// Deeper zenith the dome fades up to, for a real sky gradient.
const SKY_ZENITH: Record<Season, number> = {
  spring: 0x3f79aa,
  summer: 0x3d86be,
  autumn: 0x8a6f7d,
  winter: 0x596d8c,
}
const SKY_BLACKOUT = 0x1a1423
const SKY_BLACKOUT_ZENITH = 0x0b0812

export interface DioramaInteraction {
  region: RegionId
  placement: PlacementMode | null
  selectedPlantId: number | null
}

interface DioramaHandlers {
  onSlotSelect?(slot: number): void
  onPlantSelect?(plantId: number): void
}

// A looper travels a closed elliptical route forever — parametrised by u∈[0,1),
// so motion is continuous (no teleport/pop-in) and, with equal speed + even
// spacing, agents on the same ring keep constant gaps and never collide. Rings
// live inside the cleared road corridor (z∈[0.2,1.6]) so nothing clips houses,
// trees, plants, or the river.
interface Looper {
  object: THREE.Object3D
  cx: number
  cz: number
  rx: number
  rz: number
  u0: number // starting phase 0..1
  speed: number // revolutions per ms (sign = direction)
  yOff: number // ride height above the path
  flatY: number | null // fixed y (paved road) or null to follow terrain
  face: boolean // yaw to the route tangent
}

// Shared flat-shaded palette for the villagers + cars (ported from the DENI asset
// lab). Standard flat-shaded to match the premium terrain/foliage. All face +Z.
function std(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true })
}
const PAL = {
  terracotta: std(0xc4552f),
  teal: std(0x2f8fa8),
  amber: std(0xf2a541),
  cream: std(0xf5e7c8),
  bark: std(0x5a4632),
  ink: std(0x1a1423),
  rock: std(0x6b6258),
  skin: std(0xe8b58a),
  leaf: std(0x5d8c46),
  glass: new THREE.MeshStandardMaterial({ color: 0x2f8fa8, roughness: 0.3, metalness: 0.2, flatShading: true }),
}

// ---- Villagers (4 designs; glum posture when the region is unhappy) ----
interface VillagerLook { shirt: THREE.Material; pants: THREE.Material; hair: THREE.Material; glum: boolean }
const VILLAGERS_HAPPY: VillagerLook[] = [
  { shirt: PAL.amber, pants: PAL.bark, hair: PAL.ink, glum: false },
  { shirt: PAL.teal, pants: PAL.cream, hair: PAL.bark, glum: false },
]
const VILLAGERS_GLUM: VillagerLook[] = [
  { shirt: PAL.rock, pants: PAL.ink, hair: PAL.cream, glum: true },
  { shirt: PAL.bark, pants: PAL.rock, hair: PAL.ink, glum: true },
]

function makeCitizen(happy: boolean, index = 0): THREE.Group {
  const look = (happy ? VILLAGERS_HAPPY : VILLAGERS_GLUM)[index % 2]
  const g = new THREE.Group()
  const slump = look.glum ? -0.012 : 0
  const armAngle = look.glum ? 0.06 : 0.35
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.09, 0.042), look.pants)
    leg.position.set(s * 0.028, 0.045, 0)
    leg.castShadow = true
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.13, 5), look.shirt)
    arm.position.set(s * 0.075, 0.165 + slump, 0)
    arm.rotation.z = s * armAngle
    arm.castShadow = true
    const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018, 0), PAL.skin)
    hand.position.set(s * (0.075 + armAngle * 0.055), 0.098 + slump, 0)
    g.add(leg, arm, hand)
  }
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.068, 0.15, 6), look.shirt)
  torso.position.y = 0.165 + slump
  torso.castShadow = true
  const head = new THREE.Group()
  head.position.set(0, 0.3 + slump, look.glum ? 0.012 : 0)
  head.rotation.x = look.glum ? 0.38 : 0
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.058, 1), PAL.skin)
  skull.castShadow = true
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), look.hair)
  hair.position.set(0, 0.02, -0.008)
  hair.scale.set(1.06, 0.75, 1.06)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.02, 4), PAL.skin)
  nose.position.set(0, -0.008, 0.056)
  head.add(skull, hair, nose)
  g.add(torso, head)
  return g
}

// ---- Cars (4 body styles × rotating colors; all face +Z) ----
const CAR_BODY_COLORS = [PAL.terracotta, PAL.teal, PAL.amber, PAL.leaf, PAL.cream, PAL.rock]

function carWheels(g: THREE.Group, frontZ: number, backZ: number) {
  for (const zz of [frontZ, backZ]) {
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.032, 8), PAL.ink)
      w.rotation.z = Math.PI / 2
      w.position.set(s * 0.1, 0.045, zz)
      g.add(w)
    }
  }
}

function makeCar(index: number): THREE.Group {
  const g = new THREE.Group()
  const body = CAR_BODY_COLORS[index % CAR_BODY_COLORS.length]
  const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z)
    m.castShadow = true
    g.add(m)
    return m
  }
  switch (index % 4) {
    case 0: // hatchback
      box(0.2, 0.075, 0.36, body, 0, 0.085, 0)
      box(0.17, 0.07, 0.2, body, 0, 0.155, -0.04)
      box(0.174, 0.045, 0.14, PAL.glass, 0, 0.155, -0.04 + 0.02)
      carWheels(g, 0.115, -0.115)
      break
    case 1: // sedan
      box(0.2, 0.07, 0.4, body, 0, 0.085, 0)
      box(0.165, 0.06, 0.19, body, 0, 0.15, -0.015)
      box(0.169, 0.04, 0.15, PAL.glass, 0, 0.15, -0.015)
      carWheels(g, 0.13, -0.13)
      break
    case 2: // van
      box(0.2, 0.15, 0.38, body, 0, 0.12, -0.01)
      box(0.185, 0.055, 0.02, PAL.glass, 0, 0.155, 0.175)
      box(0.204, 0.05, 0.07, PAL.glass, 0, 0.155, 0.08)
      carWheels(g, 0.12, -0.12)
      break
    default: // pickup
      box(0.2, 0.06, 0.4, body, 0, 0.08, 0)
      box(0.18, 0.09, 0.16, body, 0, 0.155, 0.1)
      box(0.184, 0.045, 0.1, PAL.glass, 0, 0.155, 0.11)
      box(0.2, 0.05, 0.03, body, 0, 0.125, -0.19) // tailgate
      box(0.03, 0.05, 0.21, body, -0.085, 0.125, -0.1) // bed wall L
      box(0.03, 0.05, 0.21, body, 0.085, 0.125, -0.1) // bed wall R
      carWheels(g, 0.13, -0.12)
      break
  }
  g.scale.setScalar(1.5) // cars read clearly larger than the ~0.38u villagers
  return g
}

export class Diorama {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private container: HTMLElement
  private terrainGroup: THREE.Group | null = null
  private sky = makeSkyDome()
  private water: THREE.Mesh | null = null
  private plantGroup = new THREE.Group()
  private villageGroup = new THREE.Group()
  private markerGroup = new THREE.Group()
  private ambientGroup = new THREE.Group()
  private hemi: THREE.HemisphereLight
  private sun: THREE.DirectionalLight
  private blades: THREE.Group[] = []
  private loopers: Looper[] = []
  private groundAt: ((x: number, z: number) => number) | null = null
  private signature = ''
  private terrainRegion = ''
  private renderQueued = false
  private raf = 0
  private disposed = false
  private lastState: GameState | null = null
  private lastInteraction: DioramaInteraction | null = null
  private resizeObs: ResizeObserver
  private handlers: DioramaHandlers
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private pointerStart: { x: number; y: number } | null = null
  private hovered: THREE.Object3D | null = null
  private motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private onVisibility = () => {
    if (document.visibilityState === 'visible') this.startAnimation()
    else {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    }
  }

  private onPointerDown = (event: PointerEvent) => {
    this.pointerStart = { x: event.clientX, y: event.clientY }
  }
  private onPointerMove = (event: PointerEvent) => this.pick(event, false)
  private onPointerUp = (event: PointerEvent) => {
    const start = this.pointerStart
    this.pointerStart = null
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 7) this.pick(event, true)
  }

  constructor(container: HTMLElement, fxHigh: boolean, handlers: DioramaHandlers = {}) {
    this.container = container
    this.handlers = handlers
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    const mobile = window.matchMedia('(max-width: 720px)').matches
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2))
    this.renderer.shadowMap.enabled = fxHigh // no shadow maps on mobile (dev rules §6)
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap // soft-edged contact shadows
    // Filmic grade: the single biggest "premium" lever — richer contrast + color
    // depth across the whole scene (materials were eyeballed against this).
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    this.camera.position.set(9.5, 8.5, 11.5)
    this.camera.lookAt(0, 0, 0)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enablePan = false
    this.controls.minDistance = 8
    this.controls.maxDistance = 24
    this.controls.minPolarAngle = 0.5
    this.controls.maxPolarAngle = 1.35
    this.controls.enableDamping = false // damping needs a free loop — forbidden
    this.controls.addEventListener('change', () => this.requestRender())

    this.hemi = new THREE.HemisphereLight(0xfff4e0, 0x54452e, 1.15)
    this.sun = new THREE.DirectionalLight(0xffe6b3, 1.6)
    this.sun.position.set(6, 10, 4)
    if (fxHigh) {
      this.sun.castShadow = true
      this.sun.shadow.mapSize.set(2048, 2048)
      const sc = this.sun.shadow.camera
      sc.left = -12; sc.right = 12; sc.top = 12; sc.bottom = -12; sc.near = 0.5; sc.far = 46
      sc.updateProjectionMatrix() // required after changing shadow-frustum bounds
      this.sun.shadow.bias = -0.0004
      this.sun.shadow.normalBias = 0.02 // flat-shaded terrain needs this to kill acne
    }
    this.scene.add(this.sky, this.hemi, this.sun, this.plantGroup, this.villageGroup, this.markerGroup, this.ambientGroup)

    // context loss: rebuild the whole scene from state (scene = f(state), trivial)
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.signature = ''
      this.terrainRegion = ''
      if (this.lastState) this.sync(this.lastState, this.lastInteraction ?? undefined)
    })
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove)
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp)
    this.renderer.domElement.addEventListener('pointerleave', () => {
      this.hovered = null
      this.renderer.domElement.style.cursor = ''
    })

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(container)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.resize()
    this.startAnimation()
  }

  private resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (w === 0 || h === 0) return
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.fov = w / h > 1.45 ? 40 : w / h < 0.8 ? 56 : 48
    this.camera.updateProjectionMatrix()
    this.requestRender()
  }

  /** Idempotent: rebuilds only when the state-derived signature changes. */
  sync(state: GameState, interaction: DioramaInteraction = { region: state.regions[0], placement: null, selectedPlantId: null }) {
    this.lastState = state
    this.lastInteraction = interaction
    const activeRegion = state.regions.includes(interaction.region) ? interaction.region : state.regions[0]
    const rdef = regionById(activeRegion)
    const rs = state.regionState[activeRegion]!
    const season = seasonOf(state.turn)
    const blackout = Boolean(state.lastReport?.blackoutRegions.includes(activeRegion))
    const plantsSig = state.plants
      .filter((p) => p.region === activeRegion)
      .map((p) => `${p.type}:${p.slot}:${p.turnsLeft > 0 ? 'c' : 'b'}`)
      .join(',')
    const placementSig = interaction.placement?.region === activeRegion ? interaction.placement.buildable : 'none'
    const stats = cityStats(state, activeRegion)
    const sig = `${activeRegion}|${plantsSig}|${rs.prosperity}|${Math.round(stats.happiness / 5)}|${blackout ? 'dark' : 'lit'}|${season}|${placementSig}|${interaction.selectedPlantId ?? 'none'}`
    if (sig === this.signature) return
    this.signature = sig

    if (this.terrainRegion !== activeRegion) {
      if (this.terrainGroup) this.disposeGroup(this.terrainGroup)
      this.terrainGroup = makeTerrain(rdef)
      this.water = this.terrainGroup.getObjectByName('water') as THREE.Mesh | null
      this.scene.add(this.terrainGroup)
      this.terrainRegion = activeRegion
    }

    const phase = rngNext(seedFromString(activeRegion)).value * Math.PI * 2
    const profile = getTerrainProfile(rdef)
    const ground = (x: number, z: number) => terrainHeight(x, z, profile, phase)
    this.groundAt = ground // loopers read this each frame to hug the terrain

    // sky + light mood: seasons tint the day; a blackout makes the diorama GO DARK
    const horizon = blackout ? SKY_BLACKOUT : SKY[season]
    const zenith = blackout ? SKY_BLACKOUT_ZENITH : SKY_ZENITH[season]
    this.scene.background = new THREE.Color(horizon)
    paintSky(this.sky, zenith, horizon)
    // atmospheric depth: mountains + pedestal melt into the horizon band
    this.scene.fog = new THREE.Fog(horizon, 22, 50)
    this.hemi.intensity = blackout ? 0.25 : season === 'winter' ? 0.9 : 1.15
    this.sun.intensity = blackout ? 0.15 : season === 'winter' ? 1.0 : 1.6
    const sunPos: Record<Season, [number, number, number]> = {
      spring: [6, 10, 4],
      summer: [2, 13, 2],
      autumn: [-5, 8, 5],
      winter: [-7, 5, 6],
    }
    this.sun.position.set(...sunPos[season])
    this.sun.color.set(season === 'autumn' ? 0xffd9a0 : season === 'winter' ? 0xdfe8ff : 0xffe6b3)

    // ---- village: prosperity adds houses; windows die in a blackout ----
    // Rejection-sampled with a minimum gap so houses never stack on each other,
    // and kept off the river, the sea, and the road corridor.
    this.disposeChildren(this.villageGroup)
    const houses = 3 + rs.prosperity * 2
    const placedHouses: Array<[number, number]> = []
    const HOUSE_GAP = 0.82
    let word = seedFromString(`${activeRegion}-village`)
    let tries = 0
    while (placedHouses.length < houses && tries < houses * 16) {
      tries++
      const a = rngNext(word)
      const b = rngNext(a.next)
      const c = rngNext(b.next)
      word = c.next
      const ang = a.value * Math.PI * 2
      const rad = 0.9 + b.value * 1.7
      const x = -0.6 + Math.cos(ang) * rad
      const z = -0.6 + Math.sin(ang) * rad * 0.82
      if (Math.abs(x - RIVER_X) < 1.3) continue // off the river
      if (rdef.coast && z > 3.4) continue // off the sea
      if (z > -0.35 && z < 1.9 && x > -3.7 && x < 2.35) continue // clear of the ring road + margin
      if (x > 1.2 && z > 1.4) continue // leave the village-build apron clear
      const h = ground(x, z)
      if (h < 0.08 || h > 1.2) continue
      if (placedHouses.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < HOUSE_GAP)) continue
      placedHouses.push([x, z])
      const house = makeHouse(true, placedHouses.length - 1)
      // some variants have >1 window — darken them all in a blackout
      house.traverse((o) => {
        if (o.name === 'window' && o instanceof THREE.Mesh) o.material = blackout ? MAT.windowOff : MAT.windowOn
      })
      house.position.set(x, h, z)
      house.rotation.y = c.value * Math.PI * 2
      this.villageGroup.add(house)
    }

    // ---- plants on their slots ----
    this.disposeChildren(this.plantGroup)
    this.blades = []
    let rooftops = 0
    let villageExtras = 0
    for (const p of state.plants) {
      if (p.region !== activeRegion) continue
      let mesh: THREE.Group
      let pos: [number, number]
      if (p.slot !== null) {
        pos = SLOT_POS[p.slot] ?? [0, 0]
      } else {
        // village-dwelling builds (rooftop, gaspeaker, battery, translink…),
        // kept left of the river channel so nothing sits in the water
        pos = [1.2 + (villageExtras % 2) * 0.9, 2.0 + Math.floor(villageExtras / 2) * 0.85]
        villageExtras++
      }
      switch (p.type) {
        case 'rooftop': {
          // a panel on a village house roof instead of its own footprint
          const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.24), MAT.panel)
          const host = this.villageGroup.children[rooftops % Math.max(this.villageGroup.children.length, 1)]
          if (host) {
            panel.position.set(host.position.x, host.position.y + 0.52, host.position.z + 0.12)
            panel.rotation.x = -0.5
            panel.castShadow = true
            panel.userData.plantId = p.id
            this.plantGroup.add(panel)
          }
          rooftops++
          villageExtras--
          continue
        }
        case 'commsolar':
          mesh = makeSolarArray(2, 3)
          break
        case 'solarfarm':
          mesh = makeSolarArray(4, 5)
          break
        case 'turbine':
          mesh = makeTurbine(1)
          break
        case 'windfarm': {
          mesh = new THREE.Group()
          for (let i = 0; i < 3; i++) {
            const t = makeTurbine(0.85)
            t.position.set((i - 1) * 0.9, 0, (i % 2) * 0.5)
            mesh.add(t)
          }
          break
        }
        case 'offshore': {
          mesh = new THREE.Group()
          for (let i = 0; i < 2; i++) {
            const t = makeTurbine(1.1)
            t.position.set((i - 0.5) * 1.4, -0.35, 0)
            mesh.add(t)
          }
          break
        }
        case 'hpp':
          mesh = makeDam(true)
          break
        case 'mediumhydro':
          mesh = makeDam(false)
          break
        case 'smallhydro':
          mesh = makeDam(false)
          mesh.scale.setScalar(0.62) // a modest run-of-river weir
          break
        case 'pumpedhydro':
          mesh = makeDam(false)
          break
        case 'gaspeaker':
          mesh = makeGasPeaker()
          break
        case 'battery':
          mesh = makeBattery()
          break
        case 'translink':
        case 'cableshare': {
          mesh = new THREE.Group()
          for (let i = 0; i < 3; i++) {
            const py = makePylon()
            const x = pos[0] + i * 1.6
            const z = pos[1] - i * 1.2
            py.position.set(x - pos[0], ground(x, z) - ground(pos[0], pos[1]), z - pos[1])
            mesh.add(py)
          }
          break
        }
        default:
          continue // gig has no physical form
      }
      const y = p.type === 'offshore' ? -0.16 : ground(pos[0], pos[1])
      mesh.position.set(pos[0], y, pos[1])
      mesh.traverse((o) => {
        o.userData.plantId = p.id
        if (o instanceof THREE.Mesh) o.castShadow = true
      })
      if (p.turnsLeft > 0) {
        // under construction: ghosted
        mesh.traverse((o) => {
          if (o instanceof THREE.Mesh) o.material = MAT.ghost
        })
      } else {
        mesh.traverse((o) => {
          if (o.name === 'blades') this.blades.push(o as THREE.Group)
        })
      }
      if (interaction.selectedPlantId === p.id) {
        const halo = makeSlotMarker(true)
        halo.scale.setScalar(1.45)
        halo.position.y = 0.06
        halo.userData.plantId = p.id
        mesh.add(halo)
      }
      this.plantGroup.add(mesh)
    }

    // ---- construction plots: visible only when the player is placing ----
    this.disposeChildren(this.markerGroup)
    const placement = interaction.placement?.region === activeRegion ? interaction.placement : null
    if (placement) {
      const slotType = BUILDABLES[placement.buildable].slot
      const occupied = new Set(state.plants.filter((p) => p.region === activeRegion && p.slot !== null).map((p) => p.slot))
      rdef.slots.forEach((site, i) => {
        if (site.type !== slotType) return
        const available = !occupied.has(i)
        const [x, z] = SLOT_POS[i] ?? [0, 0]
        const marker = makeSlotMarker(available)
        marker.position.set(x, ground(x, z) + 0.08, z)
        marker.userData.slot = i
        marker.userData.available = available
        this.markerGroup.add(marker)
      })
    }

    // ---- ambient life: a tiny derived crowd and traffic layer, not a second sim ----
    // Everything travels closed elliptical routes that sit ENTIRELY inside the road
    // corridor (z∈[0.2,1.6], x∈[-3.8,2.4]) which house/tree placement already keeps
    // clear — so cars/people can never clip a building, tree, plant, or the river.
    this.disposeChildren(this.ambientGroup)
    this.loopers = []
    const CX = -0.7 // route centre — the widened cleared corridor (z∈[-0.4,1.95] kept clear)
    const CZ = 0.82
    const CAR_RX = 2.45
    const CAR_RZ = 0.46 // flat oval → car footprint stays clear of houses/trees/people
    const roadY = ground(CX, CZ) + 0.04
    // visible paved oval (a scaled ring band) the cars drive on
    const road = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 64), MAT.industrial)
    road.scale.set(CAR_RX, CAR_RZ, 1)
    road.rotation.x = -Math.PI / 2
    road.position.set(CX, roadY, CZ)
    road.receiveShadow = true
    this.ambientGroup.add(road)
    if (!blackout) {
      // Cars: evenly spaced, one direction, equal speed → constant gaps, no collisions.
      const cars = Math.min(6, 2 + rs.prosperity + Math.floor(stats.jobs / 180))
      for (let i = 0; i < cars; i++) {
        const car = makeCar(i)
        this.ambientGroup.add(car)
        this.loopers.push({ object: car, cx: CX, cz: CZ, rx: CAR_RX, rz: CAR_RZ, u0: i / cars, speed: 0.00002, yOff: 0, flatY: roadY, face: true })
      }
      // Pedestrians: a concentric INNER ring on the grass (never crosses the car ring),
      // even spacing + equal speed, each on a slightly different radius so they read as
      // a natural crowd, not a conga line.
      const people = Math.min(12, 4 + rs.prosperity * 2 + Math.floor(stats.jobs / 120))
      for (let i = 0; i < people; i++) {
        const person = makeCitizen(stats.happiness >= 55, i)
        this.ambientGroup.add(person)
        const rOff = (((i * 37) % 5) - 2) * 0.07 // deterministic −0.14..0.14 radial stagger
        this.loopers.push({ object: person, cx: CX, cz: CZ, rx: 1.55 + rOff, rz: 0.3 + rOff * 0.3, u0: i / people, speed: 0.0000078, yOff: 0, flatY: null, face: true })
      }
    }

    this.startAnimation()
  }

  /** Renders once on the next frame (deduped). */
  requestRender() {
    if (this.renderQueued || this.disposed) return
    this.renderQueued = true
    requestAnimationFrame(() => {
      this.renderQueued = false
      if (!this.disposed) this.renderer.render(this.scene, this.camera)
    })
  }

  private pick(event: PointerEvent, commit: boolean) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)

    // Resolve the hit (ring OR fill disc) up to its marker group, which carries
    // slot/available — so a click anywhere inside the circle counts.
    let markerHit: THREE.Object3D | null = this.raycaster.intersectObjects(this.markerGroup.children, true)[0]?.object ?? null
    while (markerHit && markerHit.parent !== this.markerGroup) markerHit = markerHit.parent
    const markerAvailable = Boolean(markerHit?.userData.available)
    let plantId: number | null = null
    if (!markerHit || !markerAvailable) {
      const plantHit = this.raycaster.intersectObjects(this.plantGroup.children, true)[0]?.object
      let node: THREE.Object3D | null = plantHit ?? null
      while (node && plantId === null) {
        if (typeof node.userData.plantId === 'number') plantId = node.userData.plantId
        node = node.parent
      }
    }

    if (this.hovered !== markerHit) {
      if (this.hovered?.parent === this.markerGroup) this.hovered.scale.setScalar(1)
      this.hovered = markerHit
      if (markerAvailable && markerHit) markerHit.scale.setScalar(1.2)
      this.requestRender()
    }
    this.renderer.domElement.style.cursor = markerAvailable || plantId !== null ? 'pointer' : ''
    if (!commit) return
    if (markerAvailable && markerHit) this.handlers.onSlotSelect?.(markerHit.userData.slot as number)
    else if (plantId !== null) this.handlers.onPlantSelect?.(plantId)
  }

  /** Lightweight cosmetic loop: the city moves, but simulation state never does. */
  private startAnimation() {
    if (!this.motionAllowed || this.disposed || document.visibilityState !== 'visible') {
      this.requestRender()
      return
    }
    if (this.raf) return
    let lastRender = 0
    const tick = (time: number) => {
      if (this.disposed || document.visibilityState !== 'visible') {
        this.raf = 0
        return
      }
      for (const blade of this.blades) blade.rotation.z = time * 0.004
      if (this.water) {
        this.water.position.y = -0.16 + Math.sin(time * 0.0011) * 0.014
        const wm = this.water.material as THREE.MeshStandardMaterial
        wm.emissiveIntensity = 0.3 + Math.sin(time * 0.0016) * 0.12
      }
      const gnd = this.groundAt
      for (const lp of this.loopers) {
        let u = (lp.u0 + time * lp.speed) % 1
        if (u < 0) u += 1
        const a = u * Math.PI * 2
        const x = lp.cx + lp.rx * Math.cos(a)
        const z = lp.cz + lp.rz * Math.sin(a)
        const y = (lp.flatY !== null ? lp.flatY : gnd ? gnd(x, z) : 0) + lp.yOff
        lp.object.position.set(x, y, z)
        if (lp.face) {
          // yaw the agent's local +Z forward axis onto the route tangent
          const dx = -lp.rx * Math.sin(a)
          const dz = lp.rz * Math.cos(a)
          lp.object.rotation.y = Math.atan2(dx, dz)
        }
      }
      if (time - lastRender >= 33) {
        this.renderer.render(this.scene, this.camera)
        lastRender = time
      }
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  private disposeChildren(group: THREE.Group) {
    for (const child of [...group.children]) {
      group.remove(child)
      child.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose() // materials are shared — keep
      })
    }
  }

  private disposeGroup(group: THREE.Group) {
    this.scene.remove(group)
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose()
        if (o.name === 'terrain') (o.material as THREE.Material).dispose()
      }
    })
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.resizeObs.disconnect()
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp)
    this.controls.dispose()
    this.scene.remove(this.sky)
    this.sky.geometry.dispose()
    ;(this.sky.material as THREE.Material).dispose()
    if (this.terrainGroup) this.disposeGroup(this.terrainGroup)
    this.disposeChildren(this.plantGroup)
    this.disposeChildren(this.villageGroup)
    this.disposeChildren(this.markerGroup)
    this.disposeChildren(this.ambientGroup)
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
