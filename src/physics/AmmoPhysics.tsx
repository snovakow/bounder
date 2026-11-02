import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { BufferGeometry, Vector3 } from 'three'
import { useSceneStore } from '../scene/store.ts'
import { loadAmmo } from './ammo.ts'

const gravity = -6
const maxSubSteps = 10

interface Physics {
  world: Ammo.btDiscreteDynamicsWorld
  // One per ball, in the balls' order
  balls: Ammo.btRigidBody[]
  // Reused to read each ball's transform
  transform: Ammo.btTransform
  destroy: () => void
}

// A Bullet world holding a dynamic sphere for each ball, at its position, and the room as a static triangle mesh
function createPhysics(
  ammo: Ammo.Module,
  room: BufferGeometry,
  positions: readonly Vector3[],
  radius: number,
): Physics {
  const configuration = new ammo.btDefaultCollisionConfiguration()
  const dispatcher = new ammo.btCollisionDispatcher(configuration)
  const broadphase = new ammo.btDbvtBroadphase()
  const solver = new ammo.btSequentialImpulseConstraintSolver()
  const world = new ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, configuration)

  // Bullet copies the vectors and transforms it's given, so these are reused throughout
  const vector = new ammo.btVector3(0, gravity, 0)
  const transform = new ammo.btTransform()
  world.setGravity(vector)

  const bodies: Ammo.btRigidBody[] = []
  const motionStates: Ammo.btMotionState[] = []
  // A body at the transform's place, free to move unless its mass is 0
  const addBody = (shape: Ammo.btCollisionShape, mass: number) => {
    const motionState = new ammo.btDefaultMotionState(transform)
    vector.setValue(0, 0, 0)
    if (mass > 0) shape.calculateLocalInertia(mass, vector)
    const info = new ammo.btRigidBodyConstructionInfo(mass, motionState, shape, vector)
    const body = new ammo.btRigidBody(info)
    ammo.destroy(info)
    world.addRigidBody(body)
    bodies.push(body)
    motionStates.push(motionState)
    return body
  }

  // One sphere shape serves every ball
  const sphere = new ammo.btSphereShape(radius)
  sphere.setMargin(0)
  const balls = positions.map((position) => {
    transform.setIdentity()
    vector.setValue(position.x, position.y, position.z)
    transform.setOrigin(vector)
    return addBody(sphere, radius * radius)
  })

  // From the room's own index, over its baked, world-space vertices
  const trimesh = new ammo.btTriangleMesh()
  const corners = [new ammo.btVector3(0, 0, 0), new ammo.btVector3(0, 0, 0), new ammo.btVector3(0, 0, 0)] as const
  const vertices = room.getAttribute('position')
  const index = room.index
  const count = index ? index.count : vertices.count
  for (let i = 0; i < count; i += 3) {
    corners.forEach((corner, j) => {
      const vertex = index ? index.getX(i + j) : i + j
      corner.setValue(vertices.getX(vertex), vertices.getY(vertex), vertices.getZ(vertex))
    })
    trimesh.addTriangle(...corners)
  }
  corners.forEach((corner) => ammo.destroy(corner))
  const roomShape = new ammo.btBvhTriangleMeshShape(trimesh, false, true)
  roomShape.setMargin(0)
  transform.setIdentity()
  addBody(roomShape, 0)

  const destroy = () => {
    bodies.forEach((body) => {
      world.removeRigidBody(body)
      ammo.destroy(body)
    })
    motionStates.forEach((motionState) => ammo.destroy(motionState))
    // The shape is freed before the triangle mesh it's built on, and the world before the parts it was made from
    const rest = [sphere, roomShape, trimesh, vector, transform, world, solver, broadphase, dispatcher, configuration]
    rest.forEach((object) => ammo.destroy(object))
  }

  return { world, balls, transform, destroy }
}

interface AmmoPhysicsProps {
  // The balls' positions, which the physics moves
  positions: RefObject<Vector3[]>
  radius: number
  // Called after each step, to move the instances to the new positions
  onStep: () => void
}

// Drops the balls onto the room with Ammo.js. Once the room is in, it loads Ammo and builds the world, and it frees it
// all on unmount. Only positions are copied, not rotations
export function AmmoPhysics({ positions, radius, onStep }: AmmoPhysicsProps) {
  const room = useSceneStore((s) => s.room)
  const physics = useRef<Physics | null>(null)

  useEffect(() => {
    let unmounted = false
    if (room) {
      loadAmmo()
        .then((ammo) => {
          if (!unmounted) physics.current = createPhysics(ammo, room.geometry, positions.current, radius)
        })
        .catch((error: unknown) => console.error(error))
    }
    return () => {
      unmounted = true
      physics.current?.destroy()
      physics.current = null
    }
  }, [room, positions, radius])

  // Step by the frame time, then copy each body's origin into its ball's position
  useFrame((_, delta) => {
    const current = physics.current
    if (!current) return

    current.world.stepSimulation(delta, maxSubSteps)
    for (let i = 0; i < current.balls.length; i++) {
      current.balls[i].getMotionState().getWorldTransform(current.transform)
      const origin = current.transform.getOrigin()
      positions.current[i].set(origin.x(), origin.y(), origin.z())
    }
    onStep()
  })

  return null
}
