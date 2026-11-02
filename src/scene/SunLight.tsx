import type { Vector3 } from 'three'
import { usePanel } from './panel.ts'

interface SunLightProps {
  position: Vector3
  area: number
}

// The sun's directional light, aimed at the origin, with a shadow camera spanning ±area
export function SunLight({ position, area }: SunLightProps) {
  const radius = usePanel((s) => s.shadowRadius)
  const normalBias = usePanel((s) => s.shadowNormalBias)
  const intensity = usePanel((s) => s.intensity)
  const bias = usePanel((s) => s.bias)
  const blurSamples = usePanel((s) => s.blurSamples)

  return (
    <directionalLight
      position={position}
      intensity={intensity}
      castShadow
      shadow-camera-left={-area}
      shadow-camera-right={area}
      shadow-camera-top={area}
      shadow-camera-bottom={-area}
      shadow-camera-near={1}
      shadow-camera-far={area * 1.5}
      shadow-mapSize={[4096, 4096]}
      shadow-bias={bias}
      shadow-normalBias={normalBias}
      shadow-radius={radius}
      shadow-blurSamples={blurSamples}
    />
  )
}
