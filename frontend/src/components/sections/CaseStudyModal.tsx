import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export const CaseStudyModal: React.FC = () => {
  const { activeCaseStudy, closeCaseStudy, openContactModal } = useAppStore()

  if (!activeCaseStudy) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCaseStudy}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-[#0c0c0c] border border-[#caff00] rounded-2xl shadow-[0_0_50px_rgba(202,255,0,0.18)] overflow-y-auto p-6 md:p-10 z-10"
        >
          {/* Close Button */}
          <button
            onClick={closeCaseStudy}
            className="absolute top-6 right-6 p-2 rounded-full bg-[#181818] text-[#888888] hover:text-[#caff00] hover:bg-[#222222] transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="space-y-3 pr-10 border-b border-[#1f1f1f] pb-6 mb-6">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 font-mono text-[11px] font-semibold tracking-wider text-[#caff00] bg-[#1a2600] border border-[#3b5305] rounded-full">
                {activeCaseStudy.tag}
              </span>
              <span className="font-mono text-xs text-[#777777]">
                CLIENT: {activeCaseStudy.client}
              </span>
            </div>
            <h2 className="font-display font-extrabold text-2xl md:text-4xl text-white tracking-tight">
              {activeCaseStudy.title}
            </h2>
            <p className="font-mono text-sm text-[#a3e635] font-semibold">
              {activeCaseStudy.metrics}
            </p>
          </div>

          {/* Body Content */}
          <div className="space-y-6">
            <div>
              <h3 className="font-mono text-xs tracking-widest text-[#888888] uppercase mb-2">
                EXECUTIVE SUMMARY
              </h3>
              <p className="font-sans text-sm md:text-base text-[#cccccc] leading-relaxed">
                {activeCaseStudy.summary}
              </p>
            </div>

            <div>
              <h3 className="font-mono text-xs tracking-widest text-[#888888] uppercase mb-2">
                ENGINEERING ARCHITECTURE & SOLUTION
              </h3>
              <p className="font-sans text-sm md:text-base text-[#999999] leading-relaxed">
                {activeCaseStudy.solution}
              </p>
            </div>

            {/* Deliverables */}
            <div>
              <h3 className="font-mono text-xs tracking-widest text-[#888888] uppercase mb-3">
                KEY DELIVERABLES
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCaseStudy.deliverables.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs md:text-sm text-[#ededed] bg-[#141414] p-3 rounded-lg border border-[#222]">
                    <CheckCircle2 size={16} className="text-[#caff00] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <h3 className="font-mono text-xs tracking-widest text-[#888888] uppercase mb-3">
                TECHNOLOGY STACK
              </h3>
              <div className="flex flex-wrap gap-2">
                {activeCaseStudy.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 font-mono text-xs text-[#ededed] bg-[#161616] border border-[#2a2a2a] rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal CTA */}
            <div className="pt-6 border-t border-[#1f1f1f] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-mono text-xs text-[#888888]">
                Interested in building something similar?
              </span>
              <button
                onClick={() => {
                  closeCaseStudy()
                  openContactModal()
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#caff00] text-black font-mono font-bold text-xs tracking-wider uppercase rounded-[2px] hover:bg-white transition-colors"
              >
                <span>INITIATE PROJECT INQUIRY</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
