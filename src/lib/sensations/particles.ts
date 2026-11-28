/**
 * Lightweight particle effects on one fixed, click-through canvas: a golden burst for a
 * right answer, confetti for a victory or a level-up. Skipped when motion is reduced.
 */
import { motionReduced } from '@/components/theme/theme-client'

let pointer = { x: 0, y: 0 }
export function trackPointer(x: number, y: number) {
  pointer = { x, y }
}
/** Where the user last pressed: bursts start from the answer they tapped. */
export function lastPointer() {
  return pointer
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  rot: number
  vr: number
  confetti: boolean
}

let canvas: HTMLCanvasElement | null = null
let parts: Particle[] = []
let running = false

function surface() {
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100dvh',
      pointerEvents: 'none',
      zIndex: '70',
    })
    document.body.append(canvas)
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  if (canvas.width !== Math.round(innerWidth * dpr)) {
    canvas.width = Math.round(innerWidth * dpr)
    canvas.height = Math.round(innerHeight * dpr)
  }
  return { c: canvas, dpr }
}

function run() {
  if (running) return
  running = true
  let last = performance.now()
  const frame = (now: number) => {
    const { c, dpr } = surface()
    const g = c.getContext('2d')!
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, innerWidth, innerHeight)
    parts = parts.filter((p) => (p.life += dt) < p.max)
    for (const p of parts) {
      p.vy += (p.confetti ? 520 : 380) * dt
      p.vx *= 0.985
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vr * dt
      g.globalAlpha = 1 - p.life / p.max
      g.fillStyle = p.color
      if (p.confetti) {
        g.save()
        g.translate(p.x, p.y)
        g.rotate(p.rot)
        g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        g.restore()
      } else {
        g.beginPath()
        g.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        g.fill()
      }
    }
    if (parts.length) requestAnimationFrame(frame)
    else {
      g.clearRect(0, 0, innerWidth, innerHeight)
      running = false
    }
  }
  requestAnimationFrame(frame)
}

function accent() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FFC83D'
}

export function burstAt(x: number, y: number, count = 26) {
  if (typeof window === 'undefined' || motionReduced()) return
  const colors = [accent(), '#FFE08A', '#FFF4CC']
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = 120 + Math.random() * 220
    parts.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      max: 0.7 + Math.random() * 0.6,
      size: 2 + Math.random() * 3,
      color: colors[(Math.random() * colors.length) | 0]!,
      rot: 0,
      vr: 0,
      confetti: false,
    })
  }
  run()
}

export function confetti(count = 110) {
  if (typeof window === 'undefined' || motionReduced()) return
  const colors = [accent(), '#FF5A43', '#5B93FF', '#F5F4FF', '#4ADE80']
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.4
    const sp = 420 + Math.random() * 420
    parts.push({
      x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
      y: innerHeight + 10,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      max: 1.4 + Math.random() * 0.9,
      size: 6 + Math.random() * 6,
      color: colors[(Math.random() * colors.length) | 0]!,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 12,
      confetti: true,
    })
  }
  run()
}
