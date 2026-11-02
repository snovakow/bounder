import { Environment } from '@react-three/drei'
import { useEffect, useState } from 'react'
import type { Vector3 } from 'three'
import { Sky } from 'three/addons/objects/Sky.js'
import { usePanel } from './panel.ts'

interface SkyEnvironmentProps {
  sunPosition: Vector3
  distance: number
}

// The sky, rendered into a cube map that is the scene's background and every standard material's environment.
// Environment renders the cube again whenever this component re-renders, so only the sky's own inputs belong here
export function SkyEnvironment({ sunPosition, distance }: SkyEnvironmentProps) {
  const turbidity = usePanel((s) => s.turbidity)
  const rayleigh = usePanel((s) => s.rayleigh)
  const mieCoefficient = usePanel((s) => s.mieCoefficient)
  const mieDirectionalG = usePanel((s) => s.mieDirectionalG)
  const cloudCoverage = usePanel((s) => s.cloudCoverage)
  const cloudDensity = usePanel((s) => s.cloudDensity)
  const cloudElevation = usePanel((s) => s.cloudElevation)

  const [sky] = useState(() => new Sky())

  // R3F never disposes of a primitive
  useEffect(
    () => () => {
      sky.geometry.dispose()
      sky.material.dispose()
    },
    [sky],
  )

  return (
    <Environment background resolution={2048} near={0.3} far={1000}>
      <primitive
        object={sky}
        scale={distance}
        material-uniforms-sunPosition-value={sunPosition}
        material-uniforms-turbidity-value={turbidity}
        material-uniforms-rayleigh-value={rayleigh}
        material-uniforms-mieCoefficient-value={mieCoefficient}
        material-uniforms-mieDirectionalG-value={mieDirectionalG}
        material-uniforms-cloudCoverage-value={cloudCoverage}
        material-uniforms-cloudDensity-value={cloudDensity}
        material-uniforms-cloudElevation-value={cloudElevation}
      />
    </Environment>
  )
}
