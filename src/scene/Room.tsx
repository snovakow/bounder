import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Mesh } from 'three'
import { useSceneStore } from './store.ts'

const modelUrl = `${import.meta.env.BASE_URL}models/collision-world.glb`

// The test room: the model's one mesh, with its world transform baked into the geometry, so raycasts and the physics
// trimesh see world-space vertices. It suspends while the model loads
export function Room() {
  const { scene } = useGLTF(modelUrl)
  const anisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy())
  // The sky cube, which Environment set before the model finished loading. A material without an envMap of its own
  // takes scene.environmentIntensity, so the room needs it as its own for its envMapIntensity to count
  const environment = useThree((s) => s.scene.environment)
  const mesh = useRef<Mesh>(null)

  // useGLTF caches what it loads, so bake into a clone and leave the loaded geometry as it is
  const { geometry, material } = useMemo(() => {
    const source = scene.getObjectByProperty('isMesh', true)
    if (!(source instanceof Mesh)) throw new Error(`No mesh in ${modelUrl}`)
    source.updateWorldMatrix(true, false)
    const baked = source.geometry.clone()
    baked.applyMatrix4(source.matrixWorld)
    baked.computeBoundingBox()
    baked.computeBoundingSphere()
    return { geometry: baked, material: source.material }
  }, [scene])

  // R3F disposes only what JSX creates
  useEffect(() => () => geometry.dispose(), [geometry])

  useEffect(() => {
    useSceneStore.setState({ room: mesh.current })
    return () => useSceneStore.setState({ room: null })
  }, [])

  // The material props come after material, so they land on the model's material
  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      material-envMap={environment}
      material-envMapIntensity={0.3}
      material-map-anisotropy={anisotropy}
      castShadow
      receiveShadow
    />
  )
}
