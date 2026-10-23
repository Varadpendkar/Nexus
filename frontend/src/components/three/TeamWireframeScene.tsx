import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { WireframeHuman, VariantType } from './WireframeHuman'

interface MemberConfig {
  id: string
  index: string
  name: string
  role: string
  variant: VariantType
}

export const TEAM_MEMBERS: MemberConfig[] = [
  {
    id: 'varad',
    index: '01',
    name: 'Varad',
    role: 'FULL-STACK + AI',
    variant: 'systems',
  },
  {
    id: 'abhijeet',
    index: '02',
    name: 'Abhijeet',
    role: 'FINTECH CONSULTANT',
    variant: 'finance',
  },
  {
    id: 'atharva',
    index: '03',
    name: 'Atharva',
    role: 'DATA SCIENTIST',
    variant: 'intelligence',
  },
  {
    id: 'yash',
    index: '04',
    name: 'Yash',
    role: 'BUSINESS DEVELOPMENT',
    variant: 'growth',
  },
]

interface TeamWireframeSceneProps {
  activeMemberIndex: number | null
  hoveredMemberIndex: number | null
  pointers: { [key: number]: { x: number; y: number } }
  reducedMotion: boolean
  isMobile: boolean
}

// Model offsets across the 4 panels in the single shared scene
const DESKTOP_POSITIONS: [number, number, number][] = [
  [-3.3, 0.1, 0],
  [-1.1, 0.1, 0],
  [1.1, 0.1, 0],
  [3.3, 0.1, 0],
]

export const TeamWireframeScene: React.FC<TeamWireframeSceneProps> = ({
  activeMemberIndex,
  hoveredMemberIndex,
  pointers,
  reducedMotion,
  isMobile,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 4, 3]} intensity={0.8} />

        <Suspense fallback={null}>
          {TEAM_MEMBERS.map((member, idx) => {
            const isHovered = hoveredMemberIndex === idx
            const isActive = activeMemberIndex === idx
            const pointer = pointers[idx] || { x: 0, y: 0 }
            const position = DESKTOP_POSITIONS[idx]

            return (
              <group key={member.id} position={position}>
                <WireframeHuman
                  variant={member.variant}
                  isHovered={isHovered}
                  isActive={isActive}
                  pointer={pointer}
                  reducedMotion={reducedMotion}
                  scale={0.92}
                />
              </group>
            )
          })}
        </Suspense>
      </Canvas>
    </div>
  )
}
