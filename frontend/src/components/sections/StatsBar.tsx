import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

interface StatItemProps {
  value: number
  prefix?: string
  suffix?: string
  label: string
  sublabel: string
}

const AnimatedStat: React.FC<StatItemProps> = ({ value, prefix = '', suffix = '', label, sublabel }) => {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!isInView) return

    let start = 0
    const duration = 1800
    const startTime = performance.now()

    const animateCount = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const current = Math.floor((1 - Math.pow(1 - progress, 3)) * value)
      setCount(current)

      if (progress < 1) {
        requestAnimationFrame(animateCount)
      } else {
        setCount(value)
      }
    }

    requestAnimationFrame(animateCount)
  }, [isInView, value])

  return (
    <div ref={ref} className="space-y-1">
      <div className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white tracking-tight tabular-nums flex items-baseline">
        <span className="text-[#caff00]">{prefix}</span>
        <span>{count}</span>
        <span className="text-[#caff00] ml-1">{suffix}</span>
      </div>
      <div className="font-mono text-xs md:text-sm font-semibold tracking-wider text-[#ededed] uppercase pt-1">
        {label}
      </div>
      <div className="font-sans text-xs text-[#777777]">
        {sublabel}
      </div>
    </div>
  )
}

export const StatsBar: React.FC = () => {
  const { setCursor, resetCursor } = useAppStore()

  return (
    <section 
      id="stats"
      onMouseEnter={() => setCursor('hover', 'STATS')}
      onMouseLeave={resetCursor}
      className="relative py-16 md:py-24 bg-[#080808] border-b border-[#1a1a1a]"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          
          <AnimatedStat
            value={14}
            suffix="+"
            label="PROJECTS DELIVERED"
            sublabel="From 0→1 MVP to enterprise scale"
          />

          <AnimatedStat
            value={4}
            suffix=""
            label="SPECIALIZED EXPERTS"
            sublabel="Direct engineering, zero middle-men"
          />

          <AnimatedStat
            value={3}
            suffix=""
            label="CORE INDUSTRIES"
            sublabel="FinTech, AI Platforms & SaaS"
          />

          <AnimatedStat
            value={0}
            prefix="₹"
            label="WASTED EFFORT"
            sublabel="100% code shipped to production"
          />

        </div>
      </div>
    </section>
  )
}
