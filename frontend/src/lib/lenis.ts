import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

let lenis: Lenis | null = null

export function initLenis() {
  if (typeof window === 'undefined') return () => {}

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !reduceMotion,
  })

  // GSAP ticker is the ONE driver — no separate RAF loop
  lenis.on('scroll', ScrollTrigger.update)
  
  const tick = (time: number) => {
    lenis?.raf(time * 1000)
  }
  
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export const getLenis = () => lenis

export const scrollToTop = () => {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.5 })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

export const scrollToId = (id: string) => {
  const target = document.getElementById(id)
  if (target) {
    if (lenis) {
      lenis.scrollTo(target, { offset: -80, duration: 1.2 })
    } else {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
