import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { WireframeHuman, VariantType } from './WireframeHuman'

interface TeamMemberSceneProps {
  variant: VariantType
  isHovered: boolean
  isActive: boolean
  pointer: { x: number; y: number }
  reducedMotion: boolean
}

export const TeamMemberScene: React.FC<TeamMemberSceneProps> = ({
  variant,
  isHovered,
  isActive,
  pointer,
  reducedMotion,
}) => {
  return (
    <div className="w-full h-full pointer-events-none relative">
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 4, 3]} intensity={0.8} />

        <Suspense fallback={null}>
          <WireframeHuman
            variant={variant}
            isHovered={isHovered}
            isActive={isActive}
            pointer={pointer}
            reducedMotion={reducedMotion}
            scale={1}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
