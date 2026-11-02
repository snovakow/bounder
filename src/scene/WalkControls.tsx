import { useThree } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import { useEffect } from 'react'
import { Raycaster, Vector3 } from 'three'
import type { Camera, Mesh } from 'three'
import { useSceneStore } from './store.ts'

const eyeHeight = 1.6
const stride = 1
const down = new Vector3(0, -1, 0)
const startPosition = new Vector3(0, 10, 0)
const startTarget = new Vector3(0, 0, -1)

// The target of drei's OrbitControls, the default controls, which R3F types only as an EventDispatcher
function orbitTarget(controls: RootState['controls']): Vector3 | null {
  return controls && 'target' in controls && controls.target instanceof Vector3 ? controls.target : null
}

// Puts the camera at eye height above the room surface below it, if there is one
function standOnRoom(camera: Camera, room: Mesh) {
  const hit = new Raycaster(camera.position, down).intersectObject(room)[0]
  if (hit) camera.position.y = hit.point.y + eyeHeight
}

// Places the camera on the room once it's in, then walks it with WASD
export function WalkControls() {
  const get = useThree((s) => s.get)
  const room = useSceneStore((s) => s.room)

  // Stand below the starting point, looking slightly up
  useEffect(() => {
    if (!room) return
    const { camera, controls } = get()
    camera.position.copy(startPosition)
    standOnRoom(camera, room)
    orbitTarget(controls)?.copy(startTarget)
  }, [get, room])

  useEffect(() => {
    // One stride in the camera's own frame, keeping its height, then onto the floor below. The orbit target becomes
    // the camera plus the level part of its view direction, which levels the view
    const onKeyDown = (event: KeyboardEvent) => {
      const step = new Vector3()
      switch (event.code) {
        case 'KeyW':
          step.z = -stride
          break
        case 'KeyS':
          step.z = stride
          break
        case 'KeyA':
          step.x = -stride
          break
        case 'KeyD':
          step.x = stride
          break
        default:
          return
      }

      // Keys do nothing until the room is in
      const currentRoom = useSceneStore.getState().room
      if (!currentRoom) return

      const { camera, controls } = get()
      camera.localToWorld(step)
      step.y = camera.position.y
      camera.position.copy(step)
      standOnRoom(camera, currentRoom)

      orbitTarget(controls)?.copy(camera.getWorldDirection(new Vector3()).setY(0).add(camera.position))
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [get])

  return null
}
