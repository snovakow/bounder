import { useMemo } from 'react'
import { MathUtils, Vector3 } from 'three'
import { usePanel } from './panel.ts'
import { SkyEnvironment } from './SkyEnvironment.tsx'
import { SunLight } from './SunLight.tsx'

// The sun sits this far from the origin, the sky is scaled to it, and the light's shadow camera spans it
const sunDistance = 30

export function SunAndSky() {
  const phi = usePanel((s) => s.sunPhi)
  const theta = usePanel((s) => s.sunTheta)

  // Polar angle from +Y and azimuth, in degrees
  const sunPosition = useMemo(
    () => new Vector3().setFromSphericalCoords(sunDistance, phi * MathUtils.DEG2RAD, theta * MathUtils.DEG2RAD),
    [phi, theta],
  )

  return (
    <>
      <SkyEnvironment sunPosition={sunPosition} distance={sunDistance} />
      <SunLight position={sunPosition} area={sunDistance} />
    </>
  )
}
