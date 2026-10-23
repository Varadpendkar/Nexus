import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { scrollToId } from '../../lib/lenis'

export const CtaSection: React.FC = () => {
  const { setCursor, resetCursor, openContactModal } = useAppStore()

  return (
    <section className="relative py-24 md:py-36 bg-[#050505] overflow-hidden border-b border-[#1a1a1a]">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#caff00]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 text-center relative z-10 space-y-8">
        
        <div className="inline-block">
          <span className="font-mono text-xs tracking-[0.25em] text-[#caff00] uppercase bg-[#141d03] px-4 py-1.5 rounded-full border border-[#3b5305]">
            [ ACCEPTING SELECT CLIENTS FOR Q1 / Q2 ]
          </span>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          onMouseEnter={() => setCursor('hover', 'BUILD')}
          onMouseLeave={resetCursor}
          className="font-display font-extrabold text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight text-white"
        >
          LET'S BUILD <br />
          <span className="text-[#caff00] drop-shadow-[0_0_25px_rgba(202,255,0,0.3)]">
            SOMETHING UNSTOPPABLE.
          </span>
        </motion.h2>

        <p className="font-sans text-sm md:text-lg text-[#888888] max-w-xl mx-auto leading-relaxed">
          Have an ambitious AI model, data pipeline, or high-performance web platform to build? Let's turn your vision into shipped code.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={openContactModal}
            onMouseEnter={() => setCursor('hover', 'TALK')}
            onMouseLeave={resetCursor}
            className="w-full sm:w-auto px-8 py-4 bg-[#caff00] text-black font-mono font-bold text-xs md:text-sm tracking-wider uppercase rounded-[2px] hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(202,255,0,0.25)] flex items-center justify-center space-x-2"
          >
            <span>[ BOOK A CALL ]</span>
            <ArrowUpRight size={16} />
          </button>

          <button
            onClick={() => scrollToId('work')}
            onMouseEnter={() => setCursor('hover', 'WORK')}
            onMouseLeave={resetCursor}
            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-[#333333] hover:border-[#caff00] text-white hover:text-[#caff00] font-mono font-semibold text-xs md:text-sm tracking-wider uppercase rounded-[2px] transition-all duration-300"
          >
            <span>[ SEE OUR WORK ]</span>
          </button>
        </div>

      </div>
    </section>
  )
}
