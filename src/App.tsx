import { Canvas } from '@react-three/fiber'
import { DebugPanel } from './scene/DebugPanel.tsx'
import { Scene } from './scene/Scene.tsx'

const camera = { fov: 90, near: 0.3, far: 1000, position: [0, 10, 0] } as const

// The Canvas props stay static: R3F re-applies them only when they change, and RendererSettings changes the renderer
// from inside. The dpr range lets the pixel ratio follow window.devicePixelRatio wherever it goes, where R3F's
// default caps it at 2
function App() {
  return (
    <>
      <Canvas camera={camera} shadows="percentage" dpr={[0, Infinity]}>
        <Scene />
      </Canvas>
      <DebugPanel />
    </>
  )
}

export default App
