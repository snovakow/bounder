// 2D intersection helpers, and a draft of wall outlines built from circles around wall points, clipped where they
// overlap. The draft is unfinished, and nothing uses it yet

const EPS = 1e-7
const PI_2 = Math.PI * 2

interface Point2 {
  x: number
  y: number
}

/*
  Where the segment (x1, y1) to (x2, y2) crosses the segment (x3, y3) to (x4, y4), as mua, the fraction of the way
  along the first. Returns -1 if the two lie on one line, and -2 if they're parallel or don't meet
*/
const segmentSegment = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
): number => {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  const numera = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)
  const numerb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)

  // Are the lines coincident?
  if (Math.abs(numera) <= EPS && Math.abs(numerb) <= EPS && Math.abs(denom) <= EPS) return -1

  // Are the lines parallel?
  if (Math.abs(denom) <= EPS) return -2

  // Is the intersection along the segments?
  const mua = numera / denom
  const mub = numerb / denom
  if (mua < 0 || mua > 1 || mub < 0 || mub > 1) return -2
  return mua
}

/*
  Where the segment from p1 to p2 first crosses the circle of radius r centred at sc, as mu, the fraction of the way
  from p1 to p2. The crossings are p = p1 + mu (p2 - p1). Returns -1 if the segment lies inside the circle, and -2 if
  it misses the circle or has no length
*/
const segmentCircle = (
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  scx: number,
  scy: number,
  r: number,
): number => {
  const dx = p2x - p1x
  const dy = p2y - p1y
  const a = dx * dx + dy * dy
  const b = 2 * (dx * (p1x - scx) + dy * (p1y - scy))
  let c = scx * scx + scy * scy
  c += p1x * p1x + p1y * p1y
  c -= 2 * (scx * p1x + scy * p1y)
  c -= r * r
  const bb4ac = b * b - 4 * a * c
  if (Math.abs(a) <= EPS || bb4ac < 0) {
    // The segment has no length, or its line misses the circle
    return -2
  }

  const a2 = 2 * a

  if (bb4ac === 0) {
    // The line touches the circle, so both values of mu are the same
    const mu = -b / a2
    if (mu >= 0 && mu <= 1) return mu
    return -2
  }

  const sqrt = Math.sqrt(bb4ac)
  const mu1 = (-b + sqrt) / a2
  const mu2 = (-b - sqrt) / a2

  if ((mu1 < 0 && mu2 < 0) || (mu1 > 1 && mu2 > 1)) {
    // The segment stops short of the circle, or starts past it: both values are below 0 or above 1
    return -2
  }
  if ((mu1 < 0 && mu2 > 1) || (mu1 > 1 && mu2 < 0)) {
    // The segment is inside the circle: one value is below 0 and the other above 1
    return -1
  }

  if (mu1 >= 0 && mu1 <= 1 && (mu2 < 0 || mu2 > 1)) {
    // The segment crosses the circle once: only one value is between 0 and 1
    return mu1
  }
  if (mu2 >= 0 && mu2 <= 1 && (mu1 < 0 || mu1 > 1)) {
    return mu2
  }

  // The segment crosses the circle twice: both values are between 0 and 1
  return Math.min(mu1, mu2)
}

interface CircleIntersection {
  intersect1: Point2
  intersect2: Point2
  // Each circle's angle toward the other's centre, from the positive x-axis
  angle1: number
  angle2: number
  // Each circle's half-angle, either side of that, to the intersection points
  angleOff1: number
  angleOff2: number
}

/*
  Where the circle of radius r0 at (x0, y0) crosses the circle of radius r1 at (x1, y1). Returns -2 if they're apart,
  -1 if one is inside the other, and 0 if they're the same circle
*/
const circleCircle = (
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
): -2 | -1 | 0 | CircleIntersection => {
  // The horizontal and vertical distances between the centres
  const dx = x1 - x0
  const dy = y1 - y0

  // The straight-line distance between the centres
  const d = Math.sqrt(dy * dy + dx * dx)

  // Is there a solution?
  if (d > r0 + r1) return -2
  if (d < Math.abs(r0 - r1)) return -1
  if (d === 0 && r0 === r1) return 0

  // Point 2 is where the line through the intersection points crosses the line between the centres.
  // a is its distance from point 0
  const a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d)
  const x2 = x0 + (dx * a) / d
  const y2 = y0 + (dy * a) / d

  // The distance from point 2 to either intersection point, and their offsets from it
  const h = Math.sqrt(r0 * r0 - a * a)
  const rx = -dy * (h / d)
  const ry = dx * (h / d)

  // Angles in radians from the positive x-axis, -pi to pi
  const angle2 = Math.atan2(-dy, -dx)
  const angle1 = angle2 > 0 ? angle2 - Math.PI : angle2 + Math.PI

  // TODO: asin stops at pi/2, so these are wrong when circles of different sizes put the chord behind a centre.
  // atan2(h, a) and atan2(h, d - a) give the true half-angles
  const angleOff1 = Math.asin(h / r0)
  const angleOff2 = r0 === r1 ? angleOff1 : Math.asin(h / r1)
  return {
    intersect1: { x: x2 + rx, y: y2 + ry },
    intersect2: { x: x2 - rx, y: y2 - ry },
    angle1,
    angle2,
    angleOff1,
    angleOff2,
  }
}

class Wall {
  radius: number
  points: Point2[] = []

  constructor(radius = 0.5) {
    this.radius = radius
  }
}

// The part of a point's circle that another circle overlaps
class Clip {
  startAngle: number
  endAngle: number
  startPoint: Point2
  endPoint: Point2

  constructor(intersect1: Point2, intersect2: Point2, angle: number, angleOff: number) {
    this.startAngle = angle - angleOff
    this.endAngle = angle + angleOff
    this.startPoint = intersect1
    this.endPoint = intersect2

    if (this.startAngle < 0) {
      this.startAngle += PI_2
      this.endAngle += PI_2
    }
  }
}

// The part of a point's circle that's left showing
class Arc {
  startAngle: number
  startPoint: Point2
  endAngle: number
  endPoint: Point2

  constructor(startAngle: number, startPoint: Point2, endAngle: number, endPoint: Point2) {
    // TODO: addClip passes a clip's end angle, which can pass 2 pi, as the start angle, so that's the one to wrap
    this.startAngle = startAngle
    this.startPoint = startPoint
    this.endAngle = endAngle > PI_2 ? endAngle - PI_2 : endAngle
    this.endPoint = endPoint
  }
}

const insideArc = (angle: number, start: number, end: number): boolean => {
  if (start < end) return angle > start && angle < end
  return angle > start || angle < end
}

class BoundPoint {
  radius: number
  point: Point2
  clips: Clip[] = []
  arcs: Arc[] | null = null

  constructor(point: Point2, radius = 0.5) {
    this.radius = radius
    this.point = point
  }

  removeOverlaps() {
    if (this.clips.length < 2) return

    this.clips.sort((a, b) => a.startAngle - b.startAngle)

    let prev = this.clips[0]
    const clips = [prev]
    for (const clip of this.clips.slice(1)) {
      if (clip.startAngle > prev.endAngle) {
        clips.push(clip)
      } else if (clip.endAngle > prev.endAngle) {
        prev.endAngle = clip.endAngle
        prev.endPoint = clip.endPoint
      }
      // TODO: prev should move only when a clip is pushed. Moving it every time compares later clips against one
      // that may have been merged away, so [10,50] [20,30] [40,60] stays two clips instead of becoming [10,60]
      prev = clip
    }
    this.clips = clips
  }

  // TODO: the clip is never added to clips, so processWalls' sort and removeOverlaps always see an empty list. Fixing
  // that means choosing whether the outline keeps clips, arcs or both
  addClip(intersect1: Point2, intersect2: Point2, angle: number, angleOff: number) {
    const clip = new Clip(intersect1, intersect2, angle, angleOff)
    if (!this.arcs) {
      this.arcs = [new Arc(clip.endAngle, clip.endPoint, clip.startAngle, clip.startPoint)]
      return
    }
    for (const arc of this.arcs) {
      const startInside = insideArc(clip.startAngle, arc.startAngle, arc.endAngle)
      const endInside = insideArc(clip.endAngle, arc.startAngle, arc.endAngle)
      if (startInside && endInside) {
        // TODO: the clip falls inside the arc, splitting it in two
      }
      if (startInside && !endInside) {
        arc.endAngle = clip.startAngle
        arc.endPoint = clip.startPoint
      }
      if (!startInside && endInside) {
        arc.startAngle = clip.endAngle
        arc.startPoint = clip.endPoint
      }
    }
  }

  // TODO: trace the outline around the point, along its arcs and between its clips. The prototype's draft was never
  // finished
  generatePath(): never {
    throw new Error('not implemented')
  }
}

export class Walls {
  walls: Wall[] = []

  static segmentSegment(s1_1: Point2, s1_2: Point2, s2_1: Point2, s2_2: Point2): number {
    return segmentSegment(s1_1.x, s1_1.y, s1_2.x, s1_2.y, s2_1.x, s2_1.y, s2_2.x, s2_2.y)
  }

  static segmentCircle(p1: Point2, p2: Point2, c: Point2, r: number): number {
    return segmentCircle(p1.x, p1.y, p2.x, p2.y, c.x, c.y, r)
  }

  static circleCircle(c1: Point2, c2: Point2, r: number): -2 | -1 | 0 | CircleIntersection {
    return circleCircle(c1.x, c1.y, r, c2.x, c2.y, r)
  }

  processWalls() {
    const boundary: BoundPoint[] = []
    for (const wall of this.walls) {
      if (wall.points.length === 0) continue
      boundary.push(new BoundPoint(wall.points[0], wall.radius))
    }

    const len = boundary.length
    for (let i1 = 0; i1 < len; i1++) {
      const bound1 = boundary[i1]

      for (let i2 = i1 + 1; i2 < len; i2++) {
        const bound2 = boundary[i2]

        const result = circleCircle(
          bound1.point.x,
          bound1.point.y,
          bound1.radius,
          bound2.point.x,
          bound2.point.y,
          bound2.radius,
        )
        // Apart, one inside the other, or the same circle
        if (typeof result === 'number') continue

        // TODO: from the first circle, intersect1 is at angle1 + angleOff1, so its clip gets its start and end points
        // the wrong way round. Passing intersect2 first would match them
        bound1.addClip(result.intersect1, result.intersect2, result.angle1, result.angleOff1)
        bound2.addClip(result.intersect1, result.intersect2, result.angle2, result.angleOff2)
      }
    }

    for (const bound of boundary) {
      bound.clips.sort((a, b) => a.startAngle - b.startAngle)
    }
  }
}
