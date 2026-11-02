import { Quaternion, Vector3 } from 'three'

// The kinds of bound the editor draws, with the labels its panel shows
export const boundTypes = ['floor', 'wall', 'track'] as const
export type BoundType = (typeof boundTypes)[number]

export const boundTypeLabels: Record<BoundType, string> = {
  floor: 'Floor',
  wall: 'Wall',
  track: 'Track',
}

export interface LinkPlacement {
  position: Vector3
  quaternion: Quaternion
  length: number
}

const up = new Vector3(0, 1, 0)

// A link is a cylinder of height 1 along +Y. Between two points, it sits at their midpoint, turned from +Y onto the
// direction from start to end, and scaled along y to their distance
export function placeLink(start: Vector3, end: Vector3): LinkPlacement {
  const direction = new Vector3().subVectors(end, start)
  const length = direction.length()
  direction.normalize()
  return {
    position: new Vector3().addVectors(start, end).multiplyScalar(0.5),
    quaternion: new Quaternion().setFromUnitVectors(up, direction),
    length,
  }
}
