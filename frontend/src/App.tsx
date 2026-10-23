import React, { useEffect, useState } from 'react'
import { initLenis } from './lib/lenis'
import { CustomCursor } from './components/ui/CustomCursor'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { Navbar } from './components/layout/Navbar'
import { Hero } from './components/sections/Hero'
import { ServiceCards } from './components/sections/ServiceCards'
import { ValueStrip } from './components/sections/ValueStrip'
import { StatsBar } from './components/sections/StatsBar'
import { ServicesDeepDive } from './components/sections/ServicesDeepDive'
import { SelectedWork } from './components/sections/SelectedWork'
import { CaseStudyModal } from './components/sections/CaseStudyModal'
import { WhyNexus } from './components/sections/WhyNexus'
import { TeamSection } from './components/sections/TeamSection'
import { ProcessSection } from './components/sections/ProcessSection'
import { CtaSection } from './components/sections/CtaSection'
import { ContactModal } from './components/sections/ContactModal'
import { Footer } from './components/layout/Footer'

export function App() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Initialize Lenis smooth scroll driven by GSAP ticker
    const cleanup = initLenis()
    return cleanup
  }, [])

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#ededed] font-sans selection:bg-[#caff00] selection:text-black">
      {/* Custom Cursor System */}
      <CustomCursor />

      {/* Loading Screen */}
      <LoadingScreen onComplete={() => setLoaded(true)} />

      {/* Main Layout */}
      <Navbar />

      <main>
        {/* Hero Section matching provided visual demo */}
        <Hero />

        {/* Bento Service Cards [ 01 ] & [ 02 ] matching demo */}
        <ServiceCards />

        {/* Continuous Value Strip Marquee */}
        <ValueStrip />

        {/* Stats Count-up Bar */}
        <StatsBar />

        {/* Selected Work Portfolio Grid with Filter */}
        <SelectedWork />

        {/* Full 7-Capabilities Accordion Deep Dive */}
        <ServicesDeepDive />

        {/* Why Nexus Technical Architecture */}
        <WhyNexus />

        {/* 4-Phase Delivery Sprint */}
        <ProcessSection />

        {/* Core Builders & Engineering Team */}
        <TeamSection />

        {/* Primary CTA Section */}
        <CtaSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Case Study Modal */}
      <CaseStudyModal />

      {/* Multi-Step Interactive Inquiry Modal */}
      <ContactModal />
    </div>
  )
}

export default App
