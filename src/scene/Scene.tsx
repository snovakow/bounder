import { OrbitControls, Stats } from '@react-three/drei'
import { Suspense } from 'react'
import { Balls } from './Balls.tsx'
import { RendererSettings } from './RendererSettings.tsx'
import { Room } from './Room.tsx'
import { SunAndSky } from './SunAndSky.tsx'
import { WalkControls } from './WalkControls.tsx'

export function Scene() {
  return (
    <>
      <SunAndSky />
      <Suspense fallback={null}>
        <Room />
      </Suspense>
      <Balls />
      <OrbitControls makeDefault enableDamping={false} />
      <WalkControls />
      <RendererSettings />
      <Stats />
    </>
  )
}
