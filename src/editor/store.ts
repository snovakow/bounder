import type { ThreeEvent } from '@react-three/fiber'
import type { Vector3 } from 'three'
import { create } from 'zustand'
import type { BoundType } from '../lib/framing.ts'

// A chain of points. Its links join consecutive points, so they're derived from the points rather than stored
export interface Bound {
  id: number
  type: BoundType
  points: readonly Vector3[]
}

interface DraggedPoint {
  boundId: number
  index: number
}

interface EditorState {
  // The panel's type, which new bounds take
  type: BoundType
  // The panel's Loop flag, which nothing acts on yet
  loop: boolean
  bounds: readonly Bound[]
  activeBoundId: number | null
  dragged: DraggedPoint | null
  setType: (type: BoundType) => void
  setLoop: (loop: boolean) => void
  addPoint: (position: Vector3) => void
  grabPoint: (boundId: number, index: number) => void
  insertPoint: (boundId: number, index: number, position: Vector3) => void
  moveDraggedPoint: (position: Vector3) => void
  release: () => void
}

let nextBoundId = 0

function withPoints(bounds: readonly Bound[], boundId: number, edit: (points: Vector3[]) => void): Bound[] {
  return bounds.map((bound) => {
    if (bound.id !== boundId) return bound
    const points = [...bound.points]
    edit(points)
    return { ...bound, points }
  })
}

// The bounds being drawn and the point being dragged. Every edit replaces the bound it touches, so the others keep
// their identity and don't re-render
export const useEditor = create<EditorState>()((set, get) => ({
  type: 'floor',
  loop: false,
  bounds: [],
  activeBoundId: null,
  dragged: null,

  setType: (type) => set({ type }),
  setLoop: (loop) => set({ loop }),

  // Extends the active bound, or starts a new one of the panel's type if there's none or it's of another type, and
  // drags the new point
  addPoint: (position) => {
    const { type, bounds, activeBoundId } = get()
    const active = bounds.find((bound) => bound.id === activeBoundId)
    if (active && active.type === type) {
      set({
        bounds: withPoints(bounds, active.id, (points) => points.push(position.clone())),
        dragged: { boundId: active.id, index: active.points.length },
      })
      return
    }
    const bound: Bound = { id: nextBoundId++, type, points: [position.clone()] }
    set({ bounds: [...bounds, bound], activeBoundId: bound.id, dragged: { boundId: bound.id, index: 0 } })
  },

  grabPoint: (boundId, index) => set({ activeBoundId: boundId, dragged: { boundId, index } }),

  // Splits the link before index with a new point there, and drags it
  insertPoint: (boundId, index, position) =>
    set({
      bounds: withPoints(get().bounds, boundId, (points) => points.splice(index, 0, position.clone())),
      activeBoundId: boundId,
      dragged: { boundId, index },
    }),

  moveDraggedPoint: (position) => {
    const { bounds, dragged } = get()
    if (!dragged) return
    set({
      bounds: withPoints(bounds, dragged.boundId, (points) => {
        points[dragged.index] = position.clone()
      }),
    })
  },

  release: () => {
    if (get().dragged) set({ dragged: null })
  },
}))

// Only Shift with the primary button edits; anything else is left to the orbit controls
export function isEditPress(event: ThreeEvent<PointerEvent>): boolean {
  return event.shiftKey && event.button === 0
}

// The room's handlers. Each stops propagation, so only the nearest surface under the pointer reacts
export function pressRoom(event: ThreeEvent<PointerEvent>) {
  if (!isEditPress(event)) return
  event.stopPropagation()
  useEditor.getState().addPoint(event.point)
}

export function dragOverRoom(event: ThreeEvent<PointerEvent>) {
  const { dragged, moveDraggedPoint } = useEditor.getState()
  if (!dragged) return
  event.stopPropagation()
  moveDraggedPoint(event.point)
}
