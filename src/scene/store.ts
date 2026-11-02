import type { Mesh } from 'three'
import { create } from 'zustand'

// The scene objects other parts reach for. Room sets its baked mesh once the model is in, for walking and physics to
// raycast against or build from; it's null until then
interface SceneObjects {
  room: Mesh | null
}

export const useSceneStore = create<SceneObjects>()(() => ({
  room: null,
}))
