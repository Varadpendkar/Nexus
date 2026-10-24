import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { TeamCard } from "../ui/TeamCard"
import { TEAM } from "../../data/team"

gsap.registerPlugin(ScrollTrigger)

// Framer Motion variants — section entry
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

const headingVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
}

export function TeamSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsWrapRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<string>("atharva")
  const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // ── ScrollTrigger: stagger cards in on scroll ─────────────────
  useEffect(() => {
    const section = sectionRef.current
    const cardsWrap = cardsWrapRef.current
    if (!section || !cardsWrap || prefersReduced) return

    const cards = Array.from(cardsWrap.querySelectorAll<HTMLElement>("[data-team-card]"))

    // Start invisible
    gsap.set(cards, { autoAlpha: 0, y: 50, scale: 0.92 })

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 75%",
      onEnter: () => {
        gsap.to(cards, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.12,           // 0.12s between each card
          clearProps: "scale",
        })
      },
      once: true,
    })

    return () => trigger.kill()
  }, [prefersReduced])

  // ── Border glow pulse on active card change ───────────────────
  useEffect(() => {
    if (prefersReduced) return
    const activeCard = sectionRef.current?.querySelector(
      `[data-card-id="${activeId}"]`
    ) as HTMLElement | null
    if (!activeCard) return

    gsap.fromTo(
      activeCard,
      { boxShadow: "0 0 0px 0px rgba(202,255,0,0)" },
      {
        boxShadow: "0 0 24px 2px rgba(202,255,0,0.25)",
        duration: 0.4,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      }
    )
  }, [activeId, prefersReduced])

  return (
    <motion.section
      ref={sectionRef}
      id="team"
      aria-labelledby="team-heading"
      tabIndex={-1}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="relative w-full py-20 px-[var(--gutter)] overflow-hidden"
      style={{ background: "var(--c-bg)" }}
    >
      {/* Anchor for Navbar link #about */}
      <div id="about" className="absolute -top-24 left-0" aria-hidden="true" />

      {/* ── Subtle background grid ─────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(202,255,0,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(202,255,0,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Grid: label col + 4 cards ──────────────────────── */}
      <div className="relative max-w-[var(--max-w)] mx-auto">
        <div
          className="grid gap-0 team-grid"
          style={{ gridTemplateColumns: "minmax(200px,260px) repeat(4,1fr)" }}
        >

          {/* ── Left label column ───────────────────────────── */}
          <div className="flex flex-col justify-between pr-8 border-r border-[#1A1A1A] team-label-col">
            <div>
              <motion.p
                variants={headingVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-mono text-xs text-[#CAFF00] mb-4 tracking-widest"
                aria-label="Team section label"
              >
                [ 05 / ARCHITECTS ]
              </motion.p>

              <motion.h2
                id="team-heading"
                variants={headingVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-display font-black text-white leading-none uppercase"
                style={{ fontSize: "var(--fs-h1)" }}
              >
                MEET
                <br />
                THE TEAM
              </motion.h2>

              <motion.p
                variants={headingVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-[#888] text-sm leading-relaxed mt-4"
                style={{ fontSize: "var(--fs-body)" }}
              >
                A tight collective of specialized engineers and founders. Faceless
                by design — our work speaks louder than our faces.
              </motion.p>
            </div>

            <div className="mt-auto pt-8">
              <p className="font-mono text-[10px] text-[#444] tracking-widest uppercase flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-[#CAFF00] inline-block"
                  aria-hidden="true"
                  style={{ boxShadow: "0 0 6px 2px rgba(202,255,0,0.5)" }}
                />
                PRODUCTION DISCIPLINE
              </p>
            </div>
          </div>

          {/* ── 4 team cards ────────────────────────────────── */}
          <div
            ref={cardsWrapRef}
            className="col-span-4 grid grid-cols-4 team-cards"
            role="list"
            aria-label="Team members"
          >
            {TEAM.map((member, index) => (
              <div
                key={member.id}
                role="listitem"
                data-team-card
                data-card-id={member.id}
                className="border-r last:border-r-0 border-[#1A1A1A]"
              >
                <TeamCard
                  member={member}
                  index={index}
                  isActive={activeId === member.id}
                  onActivate={setActiveId}
                />
              </div>
            ))}
          </div>

        </div>
      </div>
    </motion.section>
  )
}
