import { NeutralToneMapping, PCFShadowMap } from 'three'
import type { ShadowMapType, ToneMapping } from 'three'
import { create } from 'zustand'

// The debug panel's values. DebugPanel writes them, and each component reads only what it needs with a selector, so a
// light or renderer change never re-renders the sky's environment cube
export interface PanelValues {
  shadowRadius: number
  shadowNormalBias: number
  sunPhi: number
  sunTheta: number
  turbidity: number
  rayleigh: number
  mieCoefficient: number
  mieDirectionalG: number
  cloudCoverage: number
  cloudDensity: number
  cloudElevation: number
  intensity: number
  bias: number
  toneMappingExposure: number
  shadowMap: ShadowMapType
  blurSamples: number
  toneMapping: ToneMapping
}

export const usePanel = create<PanelValues>()(() => ({
  shadowRadius: 5,
  shadowNormalBias: 0.1,
  sunPhi: 45,
  sunTheta: 90,
  turbidity: 10,
  rayleigh: 0.5,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  // Cloudless to start, like the live demo; three's default is 0.4
  cloudCoverage: 0,
  cloudDensity: 0.4,
  cloudElevation: 0.5,
  intensity: 1,
  bias: -0.0001,
  toneMappingExposure: 1,
  shadowMap: PCFShadowMap,
  blurSamples: 5,
  toneMapping: NeutralToneMapping,
}))
