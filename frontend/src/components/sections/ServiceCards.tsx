import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { scrollToId } from '../../lib/lenis'

export const ServiceCards: React.FC = () => {
  const { setCursor, resetCursor, openContactModal } = useAppStore()

  const cards = [
    {
      index: '[ 01 ]',
      title: 'AI & DATA SOLUTIONS',
      description: 'Turn complex data into real business value with AI-powered solutions.',
      tags: ['MACHINE LEARNING', 'ANALYTICS', 'AUTOMATION'],
      actionId: 'services',
      cursorLabel: 'AI & DATA'
    },
    {
      index: '[ 02 ]',
      title: 'WEB & DIGITAL PRODUCTS',
      description: 'High-performance web experiences built for growth.',
      tags: ['WEB APPS', 'PLATFORMS', 'SCALABLE ARCHITECTURE'],
      actionId: 'services',
      cursorLabel: 'WEB ENG'
    }
  ]

  return (
    <section id="service-cards" className="relative py-12 md:py-20 bg-[#050505]">
      {/* Background Crosshairs */}
      <div className="absolute top-8 left-12 text-[#2a2a2a] font-mono text-sm pointer-events-none">+</div>
      <div className="absolute bottom-8 right-16 text-[#2a2a2a] font-mono text-sm pointer-events-none">+</div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.index}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.65, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => {
                scrollToId('services')
              }}
              onMouseEnter={() => setCursor('card', card.cursorLabel)}
              onMouseLeave={resetCursor}
              className="group relative cursor-pointer"
            >
              {/* Outer Card Container with Tech Border & Chamfered Accent Corners */}
              <div className="relative h-full p-8 md:p-10 bg-[#0c0c0c] border border-[#2b3a0a] group-hover:border-[#caff00] rounded-2xl transition-all duration-300 group-hover:shadow-[0_0_35px_rgba(202,255,0,0.15)] flex flex-col justify-between overflow-hidden">
                
                {/* Tech Accent Corner Notches */}
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#caff00]/40 group-hover:border-[#caff00] rounded-tr-xl transition-colors" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#caff00]/40 group-hover:border-[#caff00] rounded-bl-xl transition-colors" />

                {/* Subtle Inner Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#caff00]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Top Row: Index Tag & Arrow */}
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <span className="font-mono text-xs md:text-sm tracking-wider text-[#caff00] font-medium">
                    {card.index}
                  </span>
                  <div className="p-2 rounded-full border border-transparent group-hover:border-[#caff00]/50 text-[#ededed] group-hover:text-[#caff00] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                    <ArrowUpRight size={22} />
                  </div>
                </div>

                {/* Middle Content: Title & Description */}
                <div className="space-y-4 mb-12 relative z-10">
                  <h3 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl tracking-tight text-white group-hover:text-[#caff00] transition-colors duration-300">
                    {card.title}
                  </h3>
                  <p className="font-sans text-sm md:text-base text-[#999999] group-hover:text-[#cccccc] transition-colors leading-relaxed max-w-md">
                    {card.description}
                  </p>
                </div>

                {/* Bottom Row: Tech Tags */}
                <div className="pt-6 border-t border-[#1a1a1a] group-hover:border-[#caff00]/30 transition-colors relative z-10">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] md:text-xs text-[#777777] tracking-wider uppercase">
                    {card.tags.map((tag, tagIdx) => (
                      <React.Fragment key={tag}>
                        <span className="group-hover:text-[#ededed] transition-colors">{tag}</span>
                        {tagIdx < card.tags.length - 1 && (
                          <span className="text-[#333333] group-hover:text-[#caff00]/60">/</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
