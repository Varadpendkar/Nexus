import { create } from 'zustand'

export type CursorState = 'default' | 'hover' | 'card' | 'link' | 'text'

export interface CaseStudy {
  id: string
  title: string
  client: string
  category: 'WEB' | 'AI' | 'DATA' | 'CREATOR'
  tag: string
  metrics: string
  summary: string
  solution: string
  techStack: string[]
  deliverables: string[]
}

interface AppState {
  cursorState: CursorState
  cursorLabel: string
  setCursor: (state: CursorState, label?: string) => void
  resetCursor: () => void

  // Contact Modal
  isContactModalOpen: boolean
  openContactModal: () => void
  closeContactModal: () => void

  // Work Filter
  activeFilter: string
  setActiveFilter: (filter: string) => void

  // Case Study Modal
  activeCaseStudy: CaseStudy | null
  openCaseStudy: (study: CaseStudy) => void
  closeCaseStudy: () => void

  // Audio effect toggle (subtle futuristic click tone)
  soundEnabled: boolean
  toggleSound: () => void
}

export const useAppStore = create<AppState>((set) => ({
  cursorState: 'default',
  cursorLabel: '',
  setCursor: (state, label = '') => set({ cursorState: state, cursorLabel: label }),
  resetCursor: () => set({ cursorState: 'default', cursorLabel: '' }),

  isContactModalOpen: false,
  openContactModal: () => set({ isContactModalOpen: true }),
  closeContactModal: () => set({ isContactModalOpen: false }),

  activeFilter: 'ALL',
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  activeCaseStudy: null,
  openCaseStudy: (study) => set({ activeCaseStudy: study }),
  closeCaseStudy: () => set({ activeCaseStudy: null }),

  soundEnabled: false,
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}))
