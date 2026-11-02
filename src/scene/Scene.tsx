import { OrbitControls, Stats } from '@react-three/drei'
import { Suspense } from 'react'
import { FramingEditor } from '../editor/FramingEditor.tsx'
import { dragOverRoom, pressRoom } from '../editor/store.ts'
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
        <Room onPointerDown={pressRoom} onPointerMove={dragOverRoom} />
      </Suspense>
      <Balls />
      <FramingEditor />
      <OrbitControls makeDefault enableDamping={false} />
      <WalkControls />
      <RendererSettings />
      <Stats />
    </>
  )
}
