import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { scrollToId } from '../../lib/lenis'

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { setCursor, resetCursor, openContactModal } = useAppStore()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'WORK', id: 'work' },
    { label: 'SERVICES', id: 'services' },
    { label: 'ABOUT', id: 'about' },
    { label: 'INSIGHTS', id: 'why-nexus' },
  ]

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false)
    scrollToId(id)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#050505]/85 backdrop-blur-md border-b border-[#caff00]/20 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Brand Logo: [ NEXUS ] */}
        <button
          onClick={() => scrollToId('hero')}
          onMouseEnter={() => setCursor('hover', 'HOME')}
          onMouseLeave={resetCursor}
          className="group flex items-center space-x-1 font-mono text-sm md:text-base font-bold tracking-widest text-white transition-colors"
        >
          <span className="text-[#caff00] transition-transform duration-200 group-hover:-translate-x-1">[</span>
          <span className="px-1 tracking-widest">NEXUS</span>
          <span className="text-[#caff00] transition-transform duration-200 group-hover:translate-x-1">]</span>
        </button>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              onMouseEnter={() => setCursor('hover', 'GO')}
              onMouseLeave={resetCursor}
              className="text-xs font-mono font-medium tracking-widest text-[#888888] hover:text-[#caff00] transition-colors relative py-1 group"
            >
              <span>{link.label}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#caff00] transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </nav>

        {/* Right CTA Button: [ LET'S TALK ] */}
        <div className="hidden md:flex items-center">
          <button
            onClick={openContactModal}
            onMouseEnter={() => setCursor('hover', 'TALK')}
            onMouseLeave={resetCursor}
            className="group relative px-4 py-2 font-mono text-xs font-semibold tracking-wider text-white border border-[#222222] hover:border-[#caff00] bg-[#0d0d0d] hover:bg-[#caff00] hover:text-black transition-all duration-300 rounded-[2px]"
          >
            <span className="text-[#caff00] group-hover:text-black transition-colors">[ </span>
            <span className="px-1 tracking-wider">LET'S TALK</span>
            <span className="text-[#caff00] group-hover:text-black transition-colors"> ]</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#ededed] hover:text-[#caff00] transition-colors font-mono"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a0a]/95 border-b border-[#222] backdrop-blur-lg px-6 py-6"
          >
            <div className="flex flex-col space-y-4 font-mono text-sm">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className="text-left py-2 text-[#888888] hover:text-[#caff00] border-b border-[#181818] transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight size={14} className="text-[#caff00]" />
                </button>
              ))}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    openContactModal()
                  }}
                  className="w-full text-center py-3 bg-[#caff00] text-black font-mono font-bold text-xs tracking-wider uppercase rounded-[2px]"
                >
                  [ LET'S TALK ]
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
