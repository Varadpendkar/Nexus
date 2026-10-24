import { useRef, useEffect } from "react"
import gsap from "gsap"

export interface TeamMember {
  id: string
  number: string
  domain: string
  name: string
  role: string
  image: string
  bio: string
  skills: readonly string[]
}

interface TeamCardProps {
  member: TeamMember
  index: number
  isActive: boolean
  onActivate: (id: string) => void
}

export function TeamCard({ member, index, isActive, onActivate }: TeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const skillsRef = useRef<HTMLDivElement>(null)
  const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // ── Hover animation ──────────────────────────────────────────────
  useEffect(() => {
    const card = cardRef.current
    const img = imageRef.current
    const glow = glowRef.current
    const skills = skillsRef.current
    if (!card || !img || !glow || !skills || prefersReduced) return

    const enter = () => {
      gsap.to(img, {
        scale: 1.06,
        rotateY: 6,
        rotateX: -3,
        duration: 0.5,
        ease: "power2.out",
        transformPerspective: 800,
      })
      gsap.to(glow, {
        opacity: 0.35,
        duration: 0.4,
        ease: "power2.out",
      })
      gsap.to(skills, {
        y: 0,
        opacity: 1,
        duration: 0.35,
        ease: "power2.out",
      })
    }

    const leave = () => {
      gsap.to(img, {
        scale: 1,
        rotateY: 0,
        rotateX: 0,
        duration: 0.55,
        ease: "power3.out",
        clearProps: "transform",
      })
      gsap.to(glow, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      })
      gsap.to(skills, {
        y: 8,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
      })
    }

    card.addEventListener("mouseenter", enter)
    card.addEventListener("mouseleave", leave)

    return () => {
      card.removeEventListener("mouseenter", enter)
      card.removeEventListener("mouseleave", leave)
    }
  }, [prefersReduced])

  // ── Active card image float ───────────────────────────────────────
  useEffect(() => {
    const img = imageRef.current
    if (!img || prefersReduced) return

    if (isActive) {
      gsap.to(img, {
        y: -8,
        duration: 1.8,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
      })
    } else {
      gsap.killTweensOf(img)
      gsap.to(img, { y: 0, duration: 0.4, ease: "power2.out" })
    }
  }, [isActive, prefersReduced])

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`${member.name} — ${member.role}`}
      onClick={() => onActivate(member.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onActivate(member.id)
        }
      }}
      className={[
        "relative flex flex-col cursor-pointer select-none",
        "border transition-colors duration-300",
        "focus-visible:ring-2 focus-visible:ring-[#CAFF00] focus-visible:outline-none",
        isActive
          ? "border-[#CAFF00] bg-[#0D0D0D]"
          : "border-[#1A1A1A] bg-[#080808] hover:border-[#CAFF00]/40",
      ].join(" ")}
      style={{ borderRadius: "4px" }}
    >
      {/* ── Top meta row ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span
          className="font-mono text-xs text-[#CAFF00]"
          aria-hidden="true"
        >
          [ {member.number} ]
        </span>
        <span className="font-mono text-[10px] tracking-widest text-[#444] uppercase">
          {member.domain}
        </span>
      </div>

      {/* ── Image container ────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden mx-3 mb-0 team-card-image" style={{ minHeight: "200px" }}>

        {/* Lime glow behind image — animates on hover */}
        <div
          ref={glowRef}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 70% at 50% 60%, rgba(202,255,0,0.18) 0%, transparent 70%)",
            borderRadius: "4px",
            zIndex: 1,
          }}
        />

        <img
          ref={imageRef}
          src={member.image}
          alt={`${member.name} — faceless geometric portrait`}
          width={1122}
          height={1402}
          loading={index === 0 ? "eager" : "lazy"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom center",
            position: "relative",
            zIndex: 2,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        />

        {/* Active indicator — lime scan line at bottom */}
        {isActive && (
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#CAFF00]"
            style={{
              boxShadow: "0 0 12px 2px rgba(202,255,0,0.6)",
              zIndex: 3,
            }}
          />
        )}
      </div>

      {/* ── Skills pills — revealed on hover ───────────────── */}
      <div
        ref={skillsRef}
        aria-label={`${member.name}'s skills`}
        className="flex flex-wrap gap-1 px-4 py-2 opacity-0"
        style={{ transform: "translateY(8px)" }}
      >
        {member.skills.map((skill) => (
          <span
            key={skill}
            className="font-mono text-[9px] tracking-wider text-[#CAFF00]/70 border border-[#CAFF00]/20 px-2 py-0.5"
            style={{ borderRadius: "2px" }}
          >
            {skill}
          </span>
        ))}
      </div>

      {/* ── Name + role ────────────────────────────────────── */}
      <div ref={infoRef} className="px-4 pb-4 pt-1">
        <p className="font-display font-bold text-white text-lg leading-tight">
          {member.name}
        </p>
        <p
          className="font-mono text-[11px] tracking-widest uppercase mt-0.5"
          style={{ color: "#CAFF00" }}
        >
          {member.role}
        </p>
      </div>
    </div>
  )
}
