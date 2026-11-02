import { useEffect } from 'react'
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  BasicShadowMap,
  CineonToneMapping,
  LinearToneMapping,
  NeutralToneMapping,
  NoToneMapping,
  PCFShadowMap,
  ReinhardToneMapping,
  VSMShadowMap,
} from 'three'
import type { ShadowMapType, ToneMapping } from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { usePanel } from './panel.ts'

// three r186 removed PCFSoftShadowMap
const shadowMapTypes: Record<string, ShadowMapType> = {
  BasicShadowMap,
  PCFShadowMap,
  VSMShadowMap,
}

const toneMappingFormats: Record<string, ToneMapping> = {
  NoToneMapping,
  LinearToneMapping,
  ReinhardToneMapping,
  CineonToneMapping,
  ACESFilmicToneMapping,
  AgXToneMapping,
  NeutralToneMapping,
}

// The prototype's lil-gui panel, flat and in its order, with the cloud controls after mieDirectionalG. It edits a copy
// of the store's values and writes them back on every change; the cleanup destroys it, so StrictMode leaves one panel
export function DebugPanel() {
  useEffect(() => {
    const values = { ...usePanel.getState() }
    const gui = new GUI()

    gui.add(values, 'shadowRadius', 0, 10).name('shadow radius')
    gui.add(values, 'shadowNormalBias', 0, 0.2).name('shadow normalBias')
    gui.add(values, 'sunPhi', -90, 90).name('Sun phi')
    gui.add(values, 'sunTheta', -180, 180).name('Sun theta')
    gui.add(values, 'turbidity', 0, 20).name('turbidity')
    gui.add(values, 'rayleigh', 0, 4).name('rayleigh')
    gui.add(values, 'mieCoefficient', 0, 0.1).name('mieCoefficient')
    gui.add(values, 'mieDirectionalG', 0, 1).name('mieDirectionalG')
    gui.add(values, 'cloudCoverage', 0, 1).name('cloudCoverage')
    gui.add(values, 'cloudDensity', 0, 1).name('cloudDensity')
    gui.add(values, 'cloudElevation', 0, 1).name('cloudElevation')
    gui.add(values, 'intensity', 0, 1).name('intensity')
    gui.add(values, 'bias', -0.001, 0).name('bias')
    gui.add(values, 'toneMappingExposure', 0, 1).name('toneMappingExposure')
    gui.add(values, 'shadowMap', shadowMapTypes).name('shadowMap')
    gui.add(values, 'blurSamples', 1, 30).step(1).name('blurSamples')
    gui.add(values, 'toneMapping', toneMappingFormats).name('toneMapping')

    gui.onChange(() => usePanel.setState({ ...values }))

    return () => gui.destroy()
  }, [])

  return null
}
