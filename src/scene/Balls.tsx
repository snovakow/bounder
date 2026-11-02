import { useLayoutEffect, useRef } from 'react'
import { DynamicDrawUsage, Object3D, Vector3 } from 'three'
import type { InstancedMesh } from 'three'
import { ammoPhysics } from '../features.ts'
import { AmmoPhysics } from '../physics/AmmoPhysics.tsx'
import { blueMaterial } from './materials.ts'

const ballCount = 1000
const ballRadius = 0.3

const dummy = new Object3D()

// A grid of rows above the room, at random heights. The side isn't a whole number, so the modulo is fractional and
// each row starts a little further along than the last, which slants the grid
function layOut(): Vector3[] {
  const side = Math.sqrt(ballCount)
  return Array.from(
    { length: ballCount },
    (_, i) => new Vector3((i % side) - side * 0.5, 17 + Math.random() * 10, Math.floor(i / side) - side * 0.5),
  )
}

// Moves each instance to its position. Physics calls it every frame, so it allocates nothing
function place(instances: InstancedMesh, positions: readonly Vector3[]) {
  for (let i = 0; i < positions.length; i++) {
    dummy.position.copy(positions[i])
    dummy.updateMatrix()
    instances.setMatrixAt(i, dummy.matrix)
  }
  instances.instanceMatrix.needsUpdate = true
  instances.computeBoundingSphere()
}

// The physics test's balls, as one instanced mesh. They hold still unless physics is on, when AmmoPhysics moves them
export function Balls() {
  const mesh = useRef<InstancedMesh>(null)
  // Kept for physics to move and copy into the instances
  const positions = useRef<Vector3[]>([])

  // A layout effect places them before the first frame
  useLayoutEffect(() => {
    const instances = mesh.current
    if (!instances) return
    if (positions.current.length === 0) positions.current = layOut()

    instances.instanceMatrix.setUsage(DynamicDrawUsage)
    place(instances, positions.current)
  }, [])

  const onStep = () => {
    if (mesh.current) place(mesh.current, positions.current)
  }

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, ballCount]} material={blueMaterial} castShadow receiveShadow>
        <sphereGeometry args={[ballRadius, 24, 12]} />
      </instancedMesh>
      {ammoPhysics && <AmmoPhysics positions={positions} radius={ballRadius} onStep={onStep} />}
    </>
  )
}
