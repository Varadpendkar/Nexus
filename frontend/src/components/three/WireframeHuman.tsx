import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export type VariantType = 'systems' | 'finance' | 'intelligence' | 'growth'

interface WireframeHumanProps {
  variant: VariantType
  isActive: boolean
  isHovered: boolean
  pointer: { x: number; y: number }
  reducedMotion: boolean
  scale?: number
}

// Procedural generator for a clean, stylized faceless low-poly human bust
function createHumanBustGeometry(variant: VariantType): THREE.BufferGeometry {
  const headRadial = variant === 'systems' ? 10 : variant === 'finance' ? 7 : variant === 'intelligence' ? 12 : 8
  const headHeight = 8

  // 1. Head geometry (proportional low-poly cranium and tapered jaw)
  const headGeo = new THREE.SphereGeometry(0.52, headRadial, headHeight)
  const headPos = headGeo.attributes.position

  for (let i = 0; i < headPos.count; i++) {
    let x = headPos.getX(i)
    let y = headPos.getY(i)
    let z = headPos.getZ(i)

    // Slight elongation along Y for cranial proportion
    y *= 1.15

    // Taper bottom half to form jaw and chin (faceless silhouette)
    if (y < 0) {
      const taper = 1.0 + y * 0.5
      x *= Math.max(taper, 0.42)
      z *= Math.max(taper, 0.48)
      if (y < -0.3 && z > 0) {
        z += 0.08 * Math.abs(y)
      }
    }

    if (variant === 'finance') {
      x = Math.round(x * 8) / 8
      z = Math.round(z * 8) / 8
    }

    headPos.setXYZ(i, x, y + 0.48, z)
  }
  headGeo.computeVertexNormals()

  // 2. Neck geometry
  const neckGeo = new THREE.CylinderGeometry(0.2, 0.26, 0.4, headRadial, 2)
  neckGeo.translate(0, 0.02, -0.01)

  // 3. Torso / Shoulders geometry (clean low-poly chest contour)
  const shoulderWidth = variant === 'growth' ? 1.6 : 1.45
  const chestGeo = new THREE.CylinderGeometry(0.32, shoulderWidth, 0.75, headRadial, 2)
  chestGeo.scale(1, 1, 0.52) // Flatten depth for human silhouette
  chestGeo.translate(0, -0.45, 0)

  // Merge geometries
  const mergedGeo = new THREE.BufferGeometry()
  const headPositions = headGeo.attributes.position.array
  const neckPositions = neckGeo.attributes.position.array
  const chestPositions = chestGeo.attributes.position.array

  const totalLength = headPositions.length + neckPositions.length + chestPositions.length
  const combined = new Float32Array(totalLength)

  combined.set(headPositions, 0)
  combined.set(neckPositions, headPositions.length)
  combined.set(chestPositions, headPositions.length + neckPositions.length)

  mergedGeo.setAttribute('position', new THREE.BufferAttribute(combined, 3))
  mergedGeo.computeVertexNormals()

  return mergedGeo
}

export const WireframeHuman: React.FC<WireframeHumanProps> = ({
  variant,
  isActive,
  isHovered,
  pointer,
  reducedMotion,
  scale = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })

  // Memoize geometry per variant
  const geometry = useMemo(() => createHumanBustGeometry(variant), [variant])
  const edgesGeometry = useMemo(() => new THREE.WireframeGeometry(geometry), [geometry])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (!reducedMotion) {
      // Idle motion: subtle 8-12s breathing loop
      const time = state.clock.getElapsedTime()
      const idleY = Math.sin(time * 0.5) * 0.06
      const idleX = Math.cos(time * 0.35) * 0.03

      // Interactive mouse-tracking rotation (approx ±10° on X/Y)
      const targetMouseY = isHovered ? pointer.x * 0.28 : 0
      const targetMouseX = isHovered ? -pointer.y * 0.18 : 0

      targetRotation.current.y = idleY + targetMouseY
      targetRotation.current.x = idleX + targetMouseX

      // Smooth lerp (interpolation)
      currentRotation.current.x = THREE.MathUtils.lerp(
        currentRotation.current.x,
        targetRotation.current.x,
        Math.min(delta * 6, 1)
      )
      currentRotation.current.y = THREE.MathUtils.lerp(
        currentRotation.current.y,
        targetRotation.current.y,
        Math.min(delta * 6, 1)
      )

      groupRef.current.rotation.x = currentRotation.current.x
      groupRef.current.rotation.y = currentRotation.current.y

      // Micro float
      groupRef.current.position.y = Math.sin(time * 0.7) * 0.03
    } else {
      groupRef.current.rotation.set(0, 0, 0)
      groupRef.current.position.set(0, 0, 0)
    }

    // Scale up slightly on hover/active
    const targetScale = isHovered || isActive ? scale * 1.06 : scale
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
  })

  // Colors and opacity based on active/hover state
  const lineColor = isHovered || isActive ? '#CAFF00' : '#475e14'
  const pointColor = '#CAFF00'
  const pointSize = isHovered || isActive ? 0.038 : 0.024

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Dark Inner Core Mesh */}
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#0A0A0A" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>

      {/* Wireframe Edges in Lime */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={isHovered || isActive ? 0.95 : 0.4}
          linewidth={1}
        />
      </lineSegments>

      {/* Vertex Glow Points */}
      <points geometry={geometry}>
        <pointsMaterial
          color={pointColor}
          size={pointSize}
          transparent
          opacity={isHovered || isActive ? 0.9 : 0.3}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
