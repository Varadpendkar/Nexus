import React from 'react'

export const ValueStrip: React.FC = () => {
  const items = [
    'AI ARCHITECTURE',
    'HIGH VELOCITY',
    'DATA PLATFORMS',
    'ZERO TECH DEBT',
    'FULL STACK SCALE',
    'PRODUCTION READY',
  ]

  return (
    <div className="relative py-6 bg-[#0a0a0a] border-y border-[#1a1a1a] overflow-hidden select-none">
      <div className="flex space-x-12 whitespace-nowrap animate-[marquee_25s_linear_infinite]">
        {[...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-8">
            <span className="font-mono text-xs md:text-sm tracking-[0.25em] text-[#888888] hover:text-[#caff00] transition-colors">
              {item}
            </span>
            <span className="text-[#caff00] text-xs">◆</span>
          </div>
        ))}
      </div>
    </div>
  )
}
