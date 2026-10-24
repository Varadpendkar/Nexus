export const TEAM = [
  {
    id: "varad",
    number: "01",
    domain: "SYSTEMS",
    name: "Varad",
    role: "FULL-STACK + AI",
    image: "/assets/team/Varad.png",
    bio: "Builds complete products — frontend to AI backend.",
    skills: ["React", "FastAPI", "LLMs", "R3F"],
  },
  {
    id: "abhijeet",
    number: "02",
    domain: "FINANCE",
    name: "Abhijeet",
    role: "FINTECH CONSULTANT",
    image: "/assets/team/Abhijeet.png",
    bio: "EY + Bajaj Finance. Turns business problems into systems.",
    skills: ["FinTech", "Strategy", "APIs", "Analytics"],
  },
  {
    id: "atharva",
    number: "03",
    domain: "INTELLIGENCE",
    name: "Atharva",
    role: "DATA SCIENTIST",
    image: "/assets/team/Atharva.png",
    bio: "Turns raw data into decisions that move businesses.",
    skills: ["Power BI", "ML", "Python", "Dashboards"],
  },
  {
    id: "yash",
    number: "04",
    domain: "GROWTH",
    name: "Yash",
    role: "BUSINESS DEVELOPMENT",
    image: "/assets/team/Yash.png",
    bio: "Connects the right clients to the right solutions.",
    skills: ["Sales", "BD", "CRM", "Strategy"],
  },
] as const

export type TeamMember = (typeof TEAM)[number]
