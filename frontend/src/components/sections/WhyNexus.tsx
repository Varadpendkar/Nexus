import React from 'react'
import { motion } from 'framer-motion'
import { Zap, ShieldCheck, Cpu } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export const WhyNexus: React.FC = () => {
  const { setCursor, resetCursor } = useAppStore()

  const pillars = [
    {
      number: '01',
      title: 'VELOCITY & ZERO FRICTION',
      icon: Zap,
      subtitle: 'Senior Builders Only',
      text: 'You work directly with principal AI engineers and full-stack architects. No account managers, no junior handoffs, and zero bureaucratic friction.'
    },
    {
      number: '02',
      title: 'DEEP AI & DATA DEPTH',
      icon: Cpu,
      subtitle: 'Beyond Surface-Level Wrappers',
      text: 'We do not build flimsy API wrappers. We train domain embeddings, architect multi-agent autonomous graphs, and optimize GPU throughput for production.'
    },
    {
      number: '03',
      title: 'ZERO BLOAT ARCHITECTURE',
      icon: ShieldCheck,
      subtitle: 'Sub-Second Speed Guarantee',
      text: 'Every line of code is purpose-built. 100/100 performance budgets, clean typed architectures, and battle-tested automated CI/CD pipelines.'
    }
  ]

  return (
    <section id="why-nexus" className="relative py-20 md:py-32 bg-[#080808] border-b border-[#1a1a1a]">
      {/* Background Decor */}
      <div className="absolute top-12 left-16 text-[#222222] font-mono text-xs pointer-events-none">+</div>
      <div className="absolute bottom-12 right-20 text-[#222222] font-mono text-xs pointer-events-none">+</div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-16 space-y-3">
          <span className="font-mono text-xs tracking-widest text-[#caff00] uppercase block">
            [ 04 / THE EDGE ]
          </span>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight">
            WHY MODERN FOUNDERS CHOOSE NEXUS
          </h2>
          <p className="font-sans text-sm md:text-base text-[#888888]">
            Traditional agencies are slow, bloated, and rely on junior subcontractors. We are a specialized elite engineering strike team.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon

            return (
              <motion.div
                key={pillar.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                onMouseEnter={() => setCursor('hover', pillar.number)}
                onMouseLeave={resetCursor}
                className="relative p-8 bg-[#0d0d0d] border border-[#1f1f1f] hover:border-[#caff00]/50 rounded-2xl transition-all duration-300 group flex flex-col justify-between"
              >
                {/* Top Number & Icon */}
                <div className="flex items-start justify-between mb-8">
                  <span className="font-mono text-3xl md:text-4xl font-extrabold text-[#222222] group-hover:text-[#caff00] transition-colors">
                    {pillar.number}
                  </span>
                  <div className="p-2.5 rounded-lg bg-[#141414] text-[#caff00] border border-[#222] group-hover:border-[#caff00]/40 transition-colors">
                    <Icon size={20} />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <span className="font-mono text-[11px] text-[#caff00] tracking-wider uppercase block">
                    {pillar.subtitle}
                  </span>
                  <h3 className="font-display font-bold text-xl text-white group-hover:text-[#caff00] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="font-sans text-sm text-[#888888] leading-relaxed group-hover:text-[#aaaaaa] transition-colors">
                    {pillar.text}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#1a1a1a] flex items-center justify-between font-mono text-[11px] text-[#555555]">
                  <span>STANDARD VERIFIED</span>
                  <span className="text-[#caff00]">✓</span>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
