import { OrbitControls, Stats } from '@react-three/drei'
import { RendererSettings } from './RendererSettings.tsx'
import { SunAndSky } from './SunAndSky.tsx'

export function Scene() {
  return (
    <>
      <SunAndSky />
      <OrbitControls makeDefault enableDamping={false} />
      <RendererSettings />
      <Stats />
    </>
  )
}
