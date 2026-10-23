import React from 'react'
import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { ParticleNetwork } from '../three/ParticleNetwork'
import { scrollToId } from '../../lib/lenis'

export const Hero: React.FC = () => {
  const { setCursor, resetCursor } = useAppStore()

  return (
    <section id="hero" className="relative min-h-screen pt-28 md:pt-36 pb-12 flex flex-col justify-between overflow-hidden bg-[#050505]">
      {/* Background Crosshairs and Ambient Glow */}
      <div className="absolute inset-0 bg-tech-grid opacity-25 pointer-events-none" />
      
      {/* Decorative Technical Crosshair Markers (+) */}
      <div className="absolute top-28 left-8 md:left-20 text-[#333333] font-mono text-sm select-none pointer-events-none">+</div>
      <div className="absolute top-44 right-16 md:right-32 text-[#333333] font-mono text-sm select-none pointer-events-none">+</div>
      <div className="absolute bottom-24 left-1/3 text-[#333333] font-mono text-sm select-none pointer-events-none">+</div>
      <div className="absolute bottom-40 right-12 text-[#333333] font-mono text-sm select-none pointer-events-none">+</div>

      <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 relative z-10 flex-1 flex flex-col justify-between">
        
        {/* Top/Middle Main Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 md:pt-8">
          
          {/* Left Column: Typography & Headings (approx 7-8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center space-x-3"
            >
              <span className="font-mono text-xs md:text-sm tracking-[0.25em] text-[#888888] uppercase">
                TECHNOLOGY &nbsp;×&nbsp; CREATIVITY &nbsp;×&nbsp; IMPACT
              </span>
            </motion.div>

            {/* Giant Display: NEXUS */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-visible"
            >
              <h1
                onMouseEnter={() => setCursor('hover', 'NEXUS')}
                onMouseLeave={resetCursor}
                className="font-display font-extrabold tracking-tight text-white leading-none select-none text-[18vw] sm:text-[16vw] md:text-[13vw] lg:text-[10rem] xl:text-[11.5rem]"
                style={{ letterSpacing: '-0.04em' }}
              >
                NEXUS
              </h1>
            </motion.div>

            {/* Glowing Lime Tagline with Interactive Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center flex-wrap gap-4 pt-1"
            >
              <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight text-[#caff00] drop-shadow-[0_0_15px_rgba(202,255,0,0.3)]">
                AI. Data. Web. Built to scale.
              </h2>

              {/* Glowing Green Interactive Dot */}
              <div 
                className="relative inline-flex items-center cursor-pointer group"
                onMouseEnter={() => setCursor('hover', 'SCALE')}
                onMouseLeave={resetCursor}
              >
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#caff00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[#caff00] shadow-[0_0_18px_#caff00]"></span>
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Mission Copy + Index [ 01 ] + Interactive 3D Canvas */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6 pt-4 lg:pt-0">
            
            {/* Interactive Particle Node Canvas */}
            <div className="hidden lg:block h-48 w-full">
              <ParticleNetwork />
            </div>

            {/* Descriptor text + [ 01 ] indicator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="space-y-4 max-w-sm ml-auto"
            >
              <div className="flex items-start justify-between">
                <p className="font-sans text-xs sm:text-sm text-[#999999] leading-relaxed pr-6">
                  We build digital products powered by AI and data to help businesses scale faster.
                </p>
                <span className="font-mono text-xs text-[#888888] shrink-0 tracking-wider">
                  [ 01 ]
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Hero Bar: [ SCROLL TO EXPLORE ] & IDEAS -> PRODUCTS -> GROWTH */}
        <div className="pt-16 md:pt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4">
            
            {/* Bottom Left: [ SCROLL TO EXPLORE ] */}
            <button
              onClick={() => scrollToId('service-cards')}
              onMouseEnter={() => setCursor('hover', 'EXPLORE')}
              onMouseLeave={resetCursor}
              className="group flex flex-col items-start space-y-2 text-left"
            >
              <span className="font-mono text-xs font-semibold tracking-widest text-[#888888] group-hover:text-[#caff00] transition-colors">
                [ SCROLL TO EXPLORE ]
              </span>
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[#888888] group-hover:text-[#caff00] transition-colors pl-1"
              >
                <ArrowDown size={15} />
              </motion.div>
            </button>

            {/* Bottom Right: IDEAS -> PRODUCTS -> GROWTH */}
            <div className="flex items-center space-x-3 font-mono text-xs md:text-sm tracking-widest text-[#ededed]">
              <span className="text-[#888888]">IDEAS</span>
              <span className="text-[#caff00]">→</span>
              <span className="text-white font-semibold">PRODUCTS</span>
              <span className="text-[#caff00]">→</span>
              <span className="text-[#caff00] font-semibold">GROWTH</span>
            </div>
          </div>

          {/* Luminous Full-Width Horizontal Lime Divider Line */}
          <div className="relative w-full h-[1px] bg-[#caff00] shadow-[0_0_12px_rgba(202,255,0,0.45)]" />
        </div>

      </div>
    </section>
  )
}
