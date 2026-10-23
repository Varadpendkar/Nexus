import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseRadius: number
  isAccent: boolean
  pulseOffset: number
}

export const ParticleNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 140,
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
      initParticles()
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    // Particle pool setup
    let particles: Particle[] = []
    const particleCount = Math.min(Math.floor((width * height) / 9000), 75)

    const initParticles = () => {
      particles = []
      for (let i = 0; i < particleCount; i++) {
        const isAccent = Math.random() < 0.28 // ~28% lime accent nodes
        const baseRadius = isAccent ? Math.random() * 2.2 + 2 : Math.random() * 1.5 + 1
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: baseRadius,
          baseRadius,
          isAccent,
          pulseOffset: Math.random() * Math.PI * 2,
        })
      }
    }

    initParticles()

    let time = 0
    const render = () => {
      time += 0.02
      ctx.clearRect(0, 0, width, height)

      // Draw connective lines between nearby particles
      const maxDistance = 120
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.22
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)

            if (particles[i].isAccent || particles[j].isAccent) {
              ctx.strokeStyle = `rgba(202, 255, 0, ${alpha * 0.8})`
              ctx.lineWidth = 0.8
            } else {
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`
              ctx.lineWidth = 0.5
            }
            ctx.stroke()
          }
        }
      }

      // Draw and update each particle
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Move
        p.x += p.vx
        p.y += p.vy

        // Bounce on boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Mouse interaction
        const mdx = mouse.x - p.x
        const mdy = mouse.y - p.y
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
        if (mdist < mouse.radius) {
          const force = (1 - mdist / mouse.radius) * 1.5
          p.x -= (mdx / mdist) * force
          p.y -= (mdy / mdist) * force
        }

        // Pulse effect for accent nodes
        const pulse = p.isAccent ? Math.sin(time + p.pulseOffset) * 0.5 + 1 : 1
        const currentRadius = p.baseRadius * pulse

        ctx.beginPath()
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2)

        if (p.isAccent) {
          // Lime glow
          ctx.fillStyle = '#caff00'
          ctx.shadowColor = '#caff00'
          ctx.shadowBlur = 10
          ctx.fill()
          ctx.shadowBlur = 0
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
          ctx.fill()
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative w-full h-full min-h-[360px] md:min-h-[460px] flex items-center justify-center">
      {/* Background Soft Lime Aura */}
      <div className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#caff00]/5 filter blur-[90px] pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  )
}
