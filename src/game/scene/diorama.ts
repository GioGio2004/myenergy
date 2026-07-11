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
  makeSlotMarker,
  makeSolarArray,
  makeTerrain,
  makeTurbine,
  terrainHeight,
} from './assets'
import { seedFromString, rngNext } from '../../engine/rng'

const SKY: Record<Season, number> = {
  spring: 0x8fb8c9,
  summer: 0x9cc4d4,
  autumn: 0xc9a98f,
  winter: 0x9aa5b5,
}
const SKY_BLACKOUT = 0x1a1423

export interface DioramaInteraction {
  region: RegionId
  placement: PlacementMode | null
  selectedPlantId: number | null
}

interface DioramaHandlers {
  onSlotSelect?(slot: number): void
  onPlantSelect?(plantId: number): void
}

interface Mover {
  object: THREE.Object3D
  originX: number
  originZ: number
  span: number
  speed: number
  phase: number
  axis: 'x' | 'z'
}

function makeCitizen(happy: boolean): THREE.Group {
  const person = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 6), happy ? MAT.tree1 : MAT.industrial)
  body.position.y = 0.14
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 6), MAT.wall)
  head.position.y = 0.32
  person.add(body, head)
  return person
}

function makeCar(index: number): THREE.Group {
  const car = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.13, 0.2), index % 2 ? MAT.roof : MAT.panel)
  body.position.y = 0.12
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.18), MAT.windowOn)
  cab.position.set(0.02, 0.22, 0)
  car.add(body, cab)
  return car
}

export class Diorama {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private container: HTMLElement
  private terrainGroup: THREE.Group | null = null
  private plantGroup = new THREE.Group()
  private villageGroup = new THREE.Group()
  private markerGroup = new THREE.Group()
  private ambientGroup = new THREE.Group()
  private hemi: THREE.HemisphereLight
  private sun: THREE.DirectionalLight
  private blades: THREE.Group[] = []
  private movers: Mover[] = []
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
    if (fxHigh) this.sun.castShadow = true
    this.scene.add(this.hemi, this.sun, this.plantGroup, this.villageGroup, this.markerGroup, this.ambientGroup)

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
      this.scene.add(this.terrainGroup)
      this.terrainRegion = activeRegion
    }

    const phase = rngNext(seedFromString(activeRegion)).value * Math.PI * 2
    const ground = (x: number, z: number) => terrainHeight(x, z, rdef.coast, phase)

    // sky + light mood: seasons tint the day; a blackout makes the diorama GO DARK
    this.scene.background = new THREE.Color(blackout ? SKY_BLACKOUT : SKY[season])
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
    this.disposeChildren(this.villageGroup)
    const houses = 3 + rs.prosperity * 2
    let word = seedFromString(`${activeRegion}-village`)
    for (let i = 0; i < houses; i++) {
      const a = rngNext(word)
      const b = rngNext(a.next)
      word = b.next
      const ang = (i / houses) * Math.PI * 2 + a.value
      const rad = 0.7 + b.value * 1.1
      const x = -0.4 + Math.cos(ang) * rad
      const z = -0.2 + Math.sin(ang) * rad * 0.8
      const house = makeHouse(true)
      const win = house.getObjectByName('window') as THREE.Mesh | null
      if (win) win.material = blackout ? MAT.windowOff : MAT.windowOn
      house.position.set(x, ground(x, z), z)
      house.rotation.y = a.value * Math.PI * 2
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
        // village-dwelling builds (rooftop, gaspeaker, battery, translink…)
        pos = [1.6 + (villageExtras % 3) * 0.9, 1.9 + Math.floor(villageExtras / 3) * 0.9]
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
      mesh.traverse((o) => { o.userData.plantId = p.id })
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
    this.disposeChildren(this.ambientGroup)
    this.movers = []
    const road = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.025, 0.34), MAT.industrial)
    road.position.set(-0.2, ground(-0.2, 0.8) + 0.035, 0.8)
    road.rotation.y = -0.08
    this.ambientGroup.add(road)
    if (!blackout) {
      const cars = Math.min(5, 1 + rs.prosperity + Math.floor(stats.jobs / 180))
      for (let i = 0; i < cars; i++) {
        const car = makeCar(i)
        car.position.set(-0.2, road.position.y + 0.02, 0.76 + (i % 2) * 0.16)
        if (i % 2) car.rotation.y = Math.PI
        this.ambientGroup.add(car)
        this.movers.push({ object: car, originX: -0.2, originZ: car.position.z, span: 3.1, speed: 0.000035 + i * 0.000004, phase: i / Math.max(cars, 1), axis: 'x' })
      }
      const people = Math.min(14, 4 + rs.prosperity * 2 + Math.floor(stats.jobs / 120))
      for (let i = 0; i < people; i++) {
        const person = makeCitizen(stats.happiness >= 55)
        const side = i % 2 ? 1 : -1
        person.position.set(-2.6 + (i % 7) * 0.8, ground(0, 0.8 + side * 0.42) + 0.02, 0.8 + side * 0.42)
        this.ambientGroup.add(person)
        this.movers.push({ object: person, originX: person.position.x, originZ: person.position.z, span: 0.35, speed: 0.000018 + (i % 3) * 0.000004, phase: i / Math.max(people, 1), axis: i % 3 ? 'x' : 'z' })
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

    const markerHit = this.raycaster.intersectObjects(this.markerGroup.children, true)[0]?.object ?? null
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
      for (const mover of this.movers) {
        const progress = ((time * mover.speed + mover.phase) % 1) * 2 - 1
        if (mover.axis === 'x') mover.object.position.x = mover.originX + progress * mover.span
        else mover.object.position.z = mover.originZ + Math.sin(progress * Math.PI) * mover.span
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
    if (this.terrainGroup) this.disposeGroup(this.terrainGroup)
    this.disposeChildren(this.plantGroup)
    this.disposeChildren(this.villageGroup)
    this.disposeChildren(this.markerGroup)
    this.disposeChildren(this.ambientGroup)
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
