import React from 'react'
import { ArrowUp, Github, Linkedin, Twitter } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { scrollToTop, scrollToId } from '../../lib/lenis'

export const Footer: React.FC = () => {
  const { setCursor, resetCursor, openContactModal } = useAppStore()

  return (
    <footer className="relative py-16 bg-[#050505] text-[#ededed] border-t border-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#141414]">
          
          {/* Logo & Tagline (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-1 font-mono text-base font-bold text-white tracking-widest">
              <span className="text-[#caff00]">[</span>
              <span>NEXUS</span>
              <span className="text-[#caff00]">]</span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-[#777777] max-w-xs leading-relaxed">
              Engineering high-velocity digital products, AI architectures, and high-performance web platforms built to scale.
            </p>
          </div>

          {/* Quick Nav (4 cols) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4">
            <div>
              <span className="font-mono text-xs text-[#888888] tracking-widest uppercase block mb-3">
                INDEX
              </span>
              <ul className="space-y-2 font-mono text-xs">
                <li>
                  <button
                    onClick={() => scrollToId('hero')}
                    className="text-[#aaaaaa] hover:text-[#caff00] transition-colors"
                  >
                    HOME
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToId('service-cards')}
                    className="text-[#aaaaaa] hover:text-[#caff00] transition-colors"
                  >
                    SERVICES
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToId('work')}
                    className="text-[#aaaaaa] hover:text-[#caff00] transition-colors"
                  >
                    SELECTED WORK
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToId('about')}
                    className="text-[#aaaaaa] hover:text-[#caff00] transition-colors"
                  >
                    TEAM
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-mono text-xs text-[#888888] tracking-widest uppercase block mb-3">
                SERVICES
              </span>
              <ul className="space-y-2 font-mono text-xs text-[#777777]">
                <li>AI & Agentic Systems</li>
                <li>Full-Stack Web</li>
                <li>Real-Time Analytics</li>
                <li>FastAPI Microservices</li>
              </ul>
            </div>
          </div>

          {/* Socials & Let's Talk (4 cols) */}
          <div className="md:col-span-4 flex flex-col md:items-end justify-between space-y-6">
            <div className="space-y-2 md:text-right">
              <span className="font-mono text-xs text-[#888888] tracking-widest uppercase block">
                COMMUNICATIONS
              </span>
              <button
                onClick={openContactModal}
                className="font-mono text-sm text-[#caff00] hover:underline"
              >
                inquiries@nexusagency.dev
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-[#111111] hover:bg-[#caff00] text-[#888888] hover:text-black transition-colors"
                aria-label="GitHub"
              >
                <Github size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-[#111111] hover:bg-[#caff00] text-[#888888] hover:text-black transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-[#111111] hover:bg-[#caff00] text-[#888888] hover:text-black transition-colors"
                aria-label="Twitter / X"
              >
                <Twitter size={16} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Attribution Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#666666] gap-4">
          <div>
            © 2025 NEXUS · Crafted with precision in Pune
          </div>

          <button
            onClick={scrollToTop}
            onMouseEnter={() => setCursor('hover', 'TOP')}
            onMouseLeave={resetCursor}
            className="flex items-center space-x-2 text-[#888888] hover:text-[#caff00] transition-colors"
          >
            <span>[ BACK TO TOP ]</span>
            <ArrowUp size={14} />
          </button>
        </div>

      </div>
    </footer>
  )
}
