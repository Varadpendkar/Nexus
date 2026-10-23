import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Sparkles, Database, Globe, Cpu } from 'lucide-react'
import { useAppStore, CaseStudy } from '../../store/useAppStore'

const caseStudiesData: CaseStudy[] = [
  {
    id: 'pulse-ai',
    title: 'AURA INTELLIGENCE PLATFORM',
    client: 'Aura Systems Inc.',
    category: 'AI',
    tag: 'AGENTIC COPILOT',
    metrics: '4.2x Faster Analysis • 99.4% Extraction Accuracy',
    summary: 'Autonomous data extraction copilot processing complex multi-page financial filings into structured signals.',
    solution: 'Built an asynchronous multi-agent pipeline using FastAPI and Claude 3.5 Sonnet with vector search via Pinecone. Designed a high-density, low-latency UI in React 18 with live streaming token visualization.',
    techStack: ['FastAPI', 'LangGraph', 'React 18', 'Tailwind CSS', 'Pinecone'],
    deliverables: ['Custom LLM Extraction Engine', 'Real-time WebSocket Streaming', 'Security Guardrail Audit']
  },
  {
    id: 'nexus-quant',
    title: 'HYPERION QUANT LABS',
    client: 'Hyperion Capital',
    category: 'DATA',
    tag: 'REAL-TIME DATA VIZ',
    metrics: '12M Daily Events • <15ms Frame Latency',
    summary: 'High-frequency algorithmic trading analytics dashboard with custom WebGL charts and real-time orderbook feeds.',
    solution: 'Engineered custom canvas and WebGL shaders to render 25,000 live data points at 60fps without browser stutter. Connected to distributed Kafka brokers via Rust-backed WebSocket gateways.',
    techStack: ['Three.js', 'WebGL', 'TypeScript', 'WebSockets', 'DuckDB'],
    deliverables: ['Custom Canvas Render Engine', 'Live Orderbook Pipeline', 'Risk Calculation Microservice']
  },
  {
    id: 'solaris-web',
    title: 'SOLARIS COMPUTE CLOUD',
    client: 'Solaris Network',
    category: 'WEB',
    tag: 'DECENTRALIZED COMPUTE',
    metrics: '100/100 Lighthouse • 380ms Time-to-Interactive',
    summary: 'Dark-mode flagship developer portal and GPU cluster provisioning interface for global AI researchers.',
    solution: 'Designed and engineered an ultra-fast cyberpunk interface utilizing fluid typography, hardware-accelerated CSS animations, and instant sub-page transitions via React and Lenis.',
    techStack: ['Next.js', 'Framer Motion', 'Tailwind CSS', 'Lenis', 'Docker'],
    deliverables: ['Developer Portal UI', 'GPU Instance Booking System', 'Figma Design System']
  },
  {
    id: 'synth-creator',
    title: 'KINETIC SOUND LABS',
    client: 'Kinetic Audio',
    category: 'CREATOR',
    tag: 'AUDIO-VISUAL INTERACTIVE',
    metrics: '250K+ Monthly Active Creators',
    summary: 'Interactive procedural audio synthesizer and generative visualizer running in the browser.',
    solution: 'Harnessed the Web Audio API and custom GLSL fragment shaders to create a responsive audio workbench for musicians and game developers.',
    techStack: ['Web Audio API', 'GLSL', 'React', 'Zustand', 'Vite'],
    deliverables: ['Procedural Audio Node Engine', 'GLSL Audio Reactive Visualizer', 'Preset Export Utility']
  }
]

export const SelectedWork: React.FC = () => {
  const { activeFilter, setActiveFilter, setCursor, resetCursor, openCaseStudy } = useAppStore()

  const categories = ['ALL', 'WEB', 'AI', 'DATA', 'CREATOR']

  const filteredStudies = activeFilter === 'ALL'
    ? caseStudiesData
    : caseStudiesData.filter((item) => item.category === activeFilter)

  return (
    <section id="work" className="relative py-20 md:py-32 bg-[#050505] border-b border-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Header and Filter Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 pb-6 border-b border-[#1a1a1a] gap-8">
          <div>
            <span className="font-mono text-xs tracking-widest text-[#caff00] uppercase block mb-3">
              [ 03 / PORTFOLIO ]
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight">
              SELECTED WORK
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                onMouseEnter={() => setCursor('hover', cat)}
                onMouseLeave={resetCursor}
                className={`px-4 py-1.5 font-mono text-xs font-semibold rounded-full border transition-all duration-300 ${
                  activeFilter === cat
                    ? 'bg-[#caff00] text-black border-[#caff00] shadow-[0_0_15px_rgba(202,255,0,0.3)]'
                    : 'bg-[#0e0e0e] text-[#888888] border-[#222222] hover:border-[#444444] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Work Tiles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredStudies.map((study, idx) => {
              // Asymmetric bento layout: First item gets 7 cols, second gets 5 cols, others get 6 cols
              const colSpan = idx === 0 ? 'lg:col-span-7' : idx === 1 ? 'lg:col-span-5' : 'lg:col-span-6'

              return (
                <motion.div
                  key={study.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45 }}
                  className={`${colSpan} group cursor-pointer`}
                  onClick={() => openCaseStudy(study)}
                  onMouseEnter={() => setCursor('hover', 'CASE STUDY')}
                  onMouseLeave={resetCursor}
                >
                  <div className="relative h-full min-h-[380px] md:min-h-[440px] bg-[#0c0c0c] border border-[#1f2610] hover:border-[#caff00] rounded-2xl p-8 md:p-10 flex flex-col justify-between overflow-hidden transition-all duration-400 group-hover:shadow-[0_0_35px_rgba(202,255,0,0.12)]">
                    
                    {/* Background Decorative Tech Lines & Ambient Glow */}
                    <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#caff00]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#caff00]/10 transition-colors duration-500" />

                    {/* Top Row: Category Pill & Metrics */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="px-3 py-1 font-mono text-[11px] font-semibold tracking-wider text-[#caff00] bg-[#1a2600]/80 border border-[#3b5305] rounded-full">
                        {study.tag}
                      </span>
                      <span className="font-mono text-xs text-[#777777]">
                        {study.client}
                      </span>
                    </div>

                    {/* Middle Graphic & Abstract Tech Artifact */}
                    <div className="my-8 relative z-10 flex items-center justify-center py-6">
                      <div className="w-full max-w-[280px] h-24 border border-dashed border-[#222222] group-hover:border-[#caff00]/40 rounded-lg flex items-center justify-around px-4 transition-colors">
                        <div className="flex flex-col items-center space-y-1 text-center">
                          <Cpu size={18} className="text-[#caff00]" />
                          <span className="font-mono text-[10px] text-[#888888]">ALGO</span>
                        </div>
                        <div className="h-8 w-[1px] bg-[#222222]" />
                        <div className="flex flex-col items-center space-y-1 text-center">
                          <Database size={18} className="text-[#caff00]" />
                          <span className="font-mono text-[10px] text-[#888888]">DATA</span>
                        </div>
                        <div className="h-8 w-[1px] bg-[#222222]" />
                        <div className="flex flex-col items-center space-y-1 text-center">
                          <Globe size={18} className="text-[#caff00]" />
                          <span className="font-mono text-[10px] text-[#888888]">EDGE</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Title, Metrics, and Arrow */}
                    <div className="relative z-10 pt-4 border-t border-[#181818] group-hover:border-[#caff00]/25 transition-colors">
                      <div className="flex items-end justify-between">
                        <div className="space-y-2">
                          <h3 className="font-display font-bold text-xl md:text-2xl lg:text-3xl text-white group-hover:text-[#caff00] transition-colors">
                            {study.title}
                          </h3>
                          <p className="font-mono text-xs text-[#a3e635] tracking-wide font-medium">
                            {study.metrics}
                          </p>
                        </div>
                        <div className="p-3 bg-[#111111] group-hover:bg-[#caff00] text-white group-hover:text-black rounded-full transition-all duration-300 transform group-hover:rotate-45">
                          <ArrowUpRight size={18} />
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}
