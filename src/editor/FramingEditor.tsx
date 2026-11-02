import { useThree } from '@react-three/fiber'
import { memo, useEffect } from 'react'
import { CylinderGeometry, SphereGeometry } from 'three'
import { placeLink } from '../lib/framing.ts'
import { blueMaterial } from '../scene/materials.ts'
import { isEditPress, useEditor } from './store.ts'
import type { Bound } from './store.ts'

const pointGeometry = new SphereGeometry(0.1, 18, 9)
// Open-ended, of height 1 along +Y, so placeLink can stretch it between two points
const linkGeometry = new CylinderGeometry(0.05, 0.05, 1, 9, 1, true)

// One bound's points and the links between them. Shift-pressing a point drags it; shift-pressing a link inserts a
// point there and drags that
const BoundChain = memo(function BoundChain({ bound }: { bound: Bound }) {
  const grabPoint = useEditor((s) => s.grabPoint)
  const insertPoint = useEditor((s) => s.insertPoint)
  const links = bound.points.slice(1).map((end, i) => placeLink(bound.points[i], end))

  return (
    <>
      {bound.points.map((position, index) => (
        <mesh
          key={`point-${index}`}
          geometry={pointGeometry}
          material={blueMaterial}
          position={position}
          receiveShadow
          onPointerDown={(event) => {
            if (!isEditPress(event)) return
            event.stopPropagation()
            grabPoint(bound.id, index)
          }}
        />
      ))}
      {links.map(({ position, quaternion, length }, index) => (
        <mesh
          key={`link-${index}`}
          geometry={linkGeometry}
          material={blueMaterial}
          position={position}
          quaternion={quaternion}
          scale={[1, length, 1]}
          receiveShadow
          onPointerDown={(event) => {
            if (!isEditPress(event)) return
            event.stopPropagation()
            insertPoint(bound.id, index + 1, event.point)
          }}
        />
      ))}
    </>
  )
})

// The bounds drawn over the room. The room's own handlers, in the editor's store, add points and move the dragged one
export function FramingEditor() {
  const get = useThree((s) => s.get)
  const bounds = useEditor((s) => s.bounds)

  // Orbiting is off while a point is dragged. A subscription runs as the press is handled, before the orbit controls
  // see the same pointerdown, where an effect would run too late
  useEffect(
    () =>
      useEditor.subscribe((state, previous) => {
        const dragging = state.dragged !== null
        if (dragging === (previous.dragged !== null)) return
        const { controls } = get()
        if (controls && 'enabled' in controls) controls.enabled = !dragging
      }),
    [get],
  )

  // Releasing anywhere in the window ends the drag
  useEffect(() => {
    const release = () => useEditor.getState().release()
    window.addEventListener('pointerup', release)
    return () => window.removeEventListener('pointerup', release)
  }, [])

  return bounds.map((bound) => <BoundChain key={bound.id} bound={bound} />)
}
