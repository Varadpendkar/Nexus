import React, { useEffect, useState, useRef } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

export const CustomCursor: React.FC = () => {
  const { cursorState, cursorLabel } = useAppStore()
  const [isVisible, setIsVisible] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  // Spring physics for the outer ring trailing effect
  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 }
  const ringX = useSpring(mouseX, springConfig)
  const ringY = useSpring(mouseY, springConfig)

  useEffect(() => {
    // Detect touch device
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouch(true)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [isVisible, mouseX, mouseY])

  if (isTouch) return null

  const isExpanded = cursorState === 'card' || cursorState === 'hover' || !!cursorLabel
  const size = isExpanded ? (cursorLabel ? 72 : 54) : 32

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Outer Glow Ring */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: size,
          height: size,
          opacity: isVisible ? 1 : 0,
          backgroundColor: isExpanded ? 'rgba(202, 255, 0, 0.12)' : 'rgba(202, 255, 0, 0.04)',
          borderColor: isExpanded ? '#caff00' : 'rgba(202, 255, 0, 0.4)',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed rounded-full border flex items-center justify-center backdrop-blur-[1px]"
      >
        {cursorLabel && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[9px] font-mono font-bold tracking-widest text-[#caff00] uppercase select-none px-1 text-center"
          >
            {cursorLabel}
          </motion.span>
        )}
      </motion.div>

      {/* Center Solid Lime Dot */}
      <motion.div
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isExpanded ? 0.5 : 1,
        }}
        transition={{ duration: 0.15 }}
        className="fixed h-2 w-2 rounded-full bg-[#caff00] shadow-[0_0_12px_#caff00]"
      />
    </div>
  )
}
