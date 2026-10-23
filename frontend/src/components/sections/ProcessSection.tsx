import React from 'react'
import { motion } from 'framer-motion'
import { Search, PenTool, Terminal, Rocket } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export const ProcessSection: React.FC = () => {
  const { setCursor, resetCursor } = useAppStore()

  const steps = [
    {
      num: '01',
      title: 'DISCOVERY & ARCHITECTURE',
      duration: 'WEEK 1',
      icon: Search,
      desc: 'We tear down assumptions, evaluate AI model tradeoffs, define exact latency budgets, and lock system architecture specs.',
      bullets: ['Feasibility audit & cost modeling', 'Tech stack & schema finalization', 'Clear sprint milestones']
    },
    {
      num: '02',
      title: 'RAPID WORKING PROTOTYPE',
      duration: 'WEEKS 2 - 3',
      icon: PenTool,
      desc: 'We deliver an interactive working prototype running on test data within 14 days so you can validate real user flow immediately.',
      bullets: ['Functional frontend with live data', 'Benchmark AI model latency', 'Feedback iteration loop']
    },
    {
      num: '03',
      title: 'PRODUCTION HARDENING',
      duration: 'WEEKS 4 - 6',
      icon: Terminal,
      desc: 'We write resilient, typed production code, integrate asynchronous task queues, implement security guardrails, and audit performance.',
      bullets: ['Type-safe FastAPI & React code', '100% test coverage for critical paths', 'Security & error boundary review']
    },
    {
      num: '04',
      title: 'DEPLOY & SCALE',
      duration: 'CONTINUOUS',
      icon: Rocket,
      desc: 'Zero-downtime deployment to production cloud infrastructure with live telemetry, automated monitoring, and scale documentation.',
      bullets: ['Automated CI/CD deployment', 'Real-time telemetry & alerting', 'Complete handoff & documentation']
    }
  ]

  return (
    <section id="process" className="relative py-20 md:py-32 bg-[#080808] border-b border-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="max-w-xl mb-16 space-y-3">
          <span className="font-mono text-xs tracking-widest text-[#caff00] uppercase block">
            [ 06 / EXECUTION PIPELINE ]
          </span>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight">
            HOW WE BUILD & DELIVER
          </h2>
          <p className="font-sans text-sm md:text-base text-[#888888]">
            A predictable, transparent 4-stage engineering sprint that takes your product from concept to production-grade reality.
          </p>
        </div>

        {/* 4 Steps Timeline / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon

            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.55, delay: idx * 0.12 }}
                onMouseEnter={() => setCursor('hover', `STEP ${step.num}`)}
                onMouseLeave={resetCursor}
                className="group relative p-8 bg-[#0c0c0c] border border-[#1f1f1f] hover:border-[#caff00] rounded-xl flex flex-col justify-between transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-2xl font-bold text-[#caff00]">
                      [ {step.num} ]
                    </span>
                    <span className="font-mono text-[10px] text-[#888888] bg-[#141414] px-2.5 py-1 rounded border border-[#222]">
                      {step.duration}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-white group-hover:text-[#caff00] transition-colors mb-3">
                    {step.title}
                  </h3>

                  <p className="font-sans text-xs text-[#888888] leading-relaxed mb-6">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1a1a1a] space-y-1.5">
                  {step.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center space-x-2 font-mono text-[11px] text-[#cccccc]">
                      <span className="text-[#caff00]">›</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
