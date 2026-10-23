import React, { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { TEAM_MEMBERS } from '../three/TeamWireframeScene'
import { TeamMemberScene } from '../three/TeamMemberScene'

// Lightweight SVG wireframe fallback when WebGL is unavailable
const WireframeFallback: React.FC<{ isHovered: boolean }> = ({ isHovered }) => (
  <svg
    viewBox="0 0 100 130"
    className={`w-28 h-36 mx-auto transition-colors duration-300 ${
      isHovered ? 'stroke-[#caff00] opacity-90' : 'stroke-[#384912] opacity-50'
    }`}
    fill="none"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="50,15 68,28 64,55 50,70 36,55 32,28" />
    <polygon points="50,15 50,70 36,55" />
    <polygon points="50,15 64,55 50,70" />
    <line x1="32" y1="28" x2="68" y2="28" />
    <line x1="36" y1="55" x2="64" y2="55" />
    <line x1="42" y1="70" x2="40" y2="84" />
    <line x1="58" y1="70" x2="60" y2="84" />
    <line x1="50" y1="70" x2="50" y2="84" />
    <polygon points="14,115 40,84 60,84 86,115 50,125" />
    <line x1="50" y1="84" x2="50" y2="125" />
    <line x1="40" y1="84" x2="50" y2="125" />
    <line x1="60" y1="84" x2="50" y2="125" />
  </svg>
)

export const TeamSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' })
  const reducedMotion = useReducedMotion()
  const { setCursor, resetCursor } = useAppStore()

  const [activeMember, setActiveMember] = useState<number | null>(0)
  const [hoveredMember, setHoveredMember] = useState<number | null>(null)
  const [webglAvailable, setWebglAvailable] = useState(true)

  // Track per-member normalized pointer positions (-1 to 1)
  const [pointers, setPointers] = useState<{ [key: number]: { x: number; y: number } }>({})

  useEffect(() => {
    // Check WebGL support safely
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setWebglAvailable(!!gl)
    } catch {
      setWebglAvailable(false)
    }
  }, [])

  const handlePointerMove = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1
    setPointers((prev) => ({ ...prev, [index]: { x, y } }))
  }

  const handlePointerLeave = (index: number) => {
    setHoveredMember(null)
    resetCursor()
    setPointers((prev) => ({ ...prev, [index]: { x: 0, y: 0 } }))
  }

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-[#050505] border-b border-[#1A1A1A] overflow-hidden"
    >
      {/* Background Subtle Tech Crosshair Markers */}
      <div className="absolute top-12 left-12 text-[#222222] font-mono text-xs select-none pointer-events-none">+</div>
      <div className="absolute bottom-12 right-12 text-[#222222] font-mono text-xs select-none pointer-events-none">+</div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Main Section Grid: 27% Editorial Left + 73% 4 Member Panels Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#1A1A1A] rounded-[4px] bg-[#0D0D0D] overflow-hidden">
          
          {/* Left Editorial Panel (~27% on Desktop: 3 of 12 columns) */}
          <div className="lg:col-span-3 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-[#1A1A1A] flex flex-col justify-between bg-[#090909] relative z-20">
            <div className="space-y-6">
              <span className="font-mono text-xs text-[#CAFF00] tracking-widest uppercase block">
                [ 05 / ARCHITECTS ]
              </span>

              <h2 className="font-display font-extrabold text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-[1.08]">
                MEET <br />
                THE TEAM
              </h2>

              <p className="font-sans text-xs md:text-sm text-[#888888] leading-relaxed max-w-xs">
                A tight collective of specialized engineers and founders. Stylized faceless wireframe representations preserving privacy while delivering deep full-stack execution.
              </p>
            </div>

            <div className="pt-8 mt-8 border-t border-[#1A1A1A]">
              <div className="flex items-center space-x-2 font-mono text-[11px] text-[#666666]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#CAFF00] animate-pulse" />
                <span className="text-[#AAAAAA]">PRODUCTION DISCIPLINE</span>
              </div>
            </div>
          </div>

          {/* Right Member Panels Container (~73% on Desktop: 9 of 12 columns) */}
          <div className="lg:col-span-9 relative bg-[#0B0B0B]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-full divide-y sm:divide-y-0 sm:divide-x divide-[#1A1A1A]">
              {TEAM_MEMBERS.map((member, idx) => {
                const isHovered = hoveredMember === idx
                const isActive = activeMember === idx
                const isOtherDimmed = hoveredMember !== null && hoveredMember !== idx

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                      duration: 0.5,
                      delay: idx * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${member.name}, ${member.role}`}
                    onClick={() => setActiveMember(idx)}
                    onFocus={() => {
                      setActiveMember(idx)
                      setHoveredMember(idx)
                    }}
                    onBlur={() => setHoveredMember(null)}
                    onMouseEnter={() => {
                      setHoveredMember(idx)
                      setActiveMember(idx)
                      setCursor('hover', member.name.toUpperCase())
                    }}
                    onMouseMove={(e) => handlePointerMove(idx, e)}
                    onMouseLeave={() => handlePointerLeave(idx)}
                    className={`group relative p-6 md:p-8 flex flex-col justify-between min-h-[440px] md:min-h-[490px] transition-all duration-300 outline-none select-none cursor-pointer ${
                      isHovered || isActive
                        ? 'bg-[#121212] shadow-[inset_0_0_0_1px_#CAFF00]'
                        : 'bg-[#0D0D0D] hover:bg-[#101010]'
                    } ${isOtherDimmed ? 'opacity-50' : 'opacity-100'}`}
                  >
                    {/* Top Row: Index and Active Variant Tag */}
                    <div className="flex items-center justify-between relative z-20">
                      <span className="font-mono text-xs font-semibold tracking-wider text-[#CAFF00]">
                        [ {member.index} ]
                      </span>
                      <span
                        className={`font-mono text-[10px] tracking-widest uppercase transition-colors ${
                          isHovered || isActive ? 'text-[#CAFF00]' : 'text-[#555555]'
                        }`}
                      >
                        {member.variant}
                      </span>
                    </div>

                    {/* Middle: 3D Faceless Wireframe Human Bust */}
                    <div className="relative my-4 flex-1 flex items-center justify-center min-h-[220px]">
                      {isInView && webglAvailable ? (
                        <TeamMemberScene
                          variant={member.variant}
                          isHovered={isHovered}
                          isActive={isActive}
                          pointer={pointers[idx] || { x: 0, y: 0 }}
                          reducedMotion={reducedMotion}
                        />
                      ) : (
                        <WireframeFallback isHovered={isHovered || isActive} />
                      )}
                    </div>

                    {/* Bottom Row: Name and Role */}
                    <div className="pt-4 border-t border-[#1A1A1A] relative z-20 space-y-1 bg-inherit">
                      <h3 className="font-display font-bold text-xl md:text-2xl text-white tracking-tight">
                        {member.name}
                      </h3>
                      <div className="font-mono text-xs font-semibold text-[#CAFF00] tracking-wider uppercase">
                        {member.role}
                      </div>
                    </div>

                    {/* Corner Accent Notch */}
                    <div
                      className={`absolute top-0 right-0 w-3 h-3 border-t border-r transition-colors ${
                        isHovered || isActive ? 'border-[#CAFF00]' : 'border-transparent'
                      }`}
                    />
                  </motion.div>
                )
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
