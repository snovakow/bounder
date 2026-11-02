import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { usePanel } from './panel.ts'

// Applies the panel's renderer settings. A change of tone mapping or shadow type recompiles the materials on the next
// frame without help
export function RendererSettings() {
  const get = useThree((s) => s.get)
  const toneMapping = usePanel((s) => s.toneMapping)
  const toneMappingExposure = usePanel((s) => s.toneMappingExposure)
  const shadowMap = usePanel((s) => s.shadowMap)

  // A layout effect runs before the first frame, so R3F's ACES default never shows
  useLayoutEffect(() => {
    const { gl } = get()
    gl.toneMapping = toneMapping
    gl.toneMappingExposure = toneMappingExposure
    gl.shadowMap.type = shadowMap
  }, [get, toneMapping, toneMappingExposure, shadowMap])

  return null
}
