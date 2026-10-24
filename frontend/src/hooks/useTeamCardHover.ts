import { useEffect, RefObject } from 'react'
import gsap from 'gsap'

interface HoverRefs {
  cardRef: RefObject<HTMLElement | null>
  imageRef: RefObject<HTMLElement | null>
  glowRef: RefObject<HTMLElement | null>
  skillsRef: RefObject<HTMLElement | null>
}

export function useTeamCardHover({ cardRef, imageRef, glowRef, skillsRef }: HoverRefs) {
  useEffect(() => {
    const card = cardRef.current
    const img = imageRef.current
    const glow = glowRef.current
    const skills = skillsRef.current
    if (!card || !img || !glow || !skills) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const enter = () => {
      gsap.to(img, {
        scale: 1.06,
        rotateY: 6,
        rotateX: -3,
        duration: 0.5,
        ease: 'power2.out',
        transformPerspective: 800,
      })
      gsap.to(glow, {
        opacity: 0.35,
        duration: 0.4,
        ease: 'power2.out',
      })
      gsap.to(skills, {
        y: 0,
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out',
      })
    }

    const leave = () => {
      gsap.to(img, {
        scale: 1,
        rotateY: 0,
        rotateX: 0,
        duration: 0.55,
        ease: 'power3.out',
        clearProps: 'transform',
      })
      gsap.to(glow, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      })
      gsap.to(skills, {
        y: 8,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      })
    }

    card.addEventListener('mouseenter', enter)
    card.addEventListener('mouseleave', leave)

    return () => {
      card.removeEventListener('mouseenter', enter)
      card.removeEventListener('mouseleave', leave)
    }
  }, [cardRef, imageRef, glowRef, skillsRef])
}
