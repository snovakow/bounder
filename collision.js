// import {
// 	Vector2,
// } from 'three';

const EPS = 1e-7;

class VectorArray extends Float32Array {
	constructor(...args) {
		super(args);
	}
}

class Vector2Array extends VectorArray {
	constructor(x = 0, y = 0) {
		super(x, y);
	}
	get x() {
		return this[0];
	}
	set x(x) {
		this[0] = x;
	}
	get y() {
		return this[1];
	}
	set y(y) {
		this[1] = y;
	}
	add(v) {
		this[0] += v[0];
		this[1] += v[1];
	}
}

/*
   Determine the intersection point of two line segments
   Return FALSE if the lines don't intersect
*/
const segmentSegment = (x1, y1, x2, y2, x3, y3, x4, y4) => {
	let mua, mub;
	let denom, numera, numerb;

	denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
	numera = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
	numerb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

	/* Are the line coincident? */
	if (Math.abs(numera) <= EPS && Math.abs(numerb) <= EPS && Math.abs(denom) <= EPS) {
		// const x = (x1 + x2) / 2;
		// const y = (y1 + y2) / 2;
		return -1;
	}

	/* Are the line parallel */
	if (Math.abs(denom) <= EPS) {
		return -2;
	}

	/* Is the intersection along the the segments */
	mua = numera / denom;
	mub = numerb / denom;
	if (mua < 0 || mua > 1 || mub < 0 || mub > 1) {
		return -2;
	}
	// const x = x1 + mua * (x2 - x1);
	// const y = y1 + mua * (y2 - y1);
	return mua;
}

/*
   Calculate the intersection of a ray and a sphere
   The line segment is defined from p1 to p2
   The sphere is of radius r and centered at sc
   There are potentially two points of intersection given by
   p = p1 + mu1 (p2 - p1)
   p = p1 + mu2 (p2 - p1)
   Return FALSE if the ray doesn't intersect the sphere.
*/
const segmentCircle = (p1x, p1y, p2x, p2y, scx, scy, r) => {
	let a, b, c;
	let bb4ac;
	let dp = {};

	dp.x = p2x - p1x;
	dp.y = p2y - p1y;
	a = dp.x * dp.x + dp.y * dp.y;
	b = 2 * (dp.x * (p1x - scx) + dp.y * (p1y - scy));
	c = scx * scx + scy * scy;
	c += p1x * p1x + p1y * p1y;
	c -= 2 * (scx * p1x + scy * p1y);
	c -= r * r;
	bb4ac = b * b - 4 * a * c;
	if (Math.abs(a) <= EPS || bb4ac < 0) {
		// line does not intersect the sphere
		return -2;
	}

	const a2 = 2 * a;

	if (bb4ac === 0) {
		// Line segment is tangential to the sphere, in which case both values of u will be the same and between 0 and 1.
		const mu = -b / a2;
		if (mu >= 0 && mu <= 1) return mu;
		return -2;
	}

	const sqrt = Math.sqrt(bb4ac);
	const mu1 = (-b + sqrt) / a2;
	const mu2 = (-b - sqrt) / a2;

	if ((mu1 < 0 && mu2 < 0) || (mu1 > 1 && mu2 > 1)) {
		// Line segment doesn't intersect and on outside of sphere, in which case both values of u will either be less than 0 or greater than 1.
		return -2;
	}
	if ((mu1 < 0 && mu2 > 1) || (mu1 > 1 && mu2 < 0)) {
		// Line segment doesn't intersect and is inside sphere, in which case one value of u will be negative and the other greater than 1.
		return -1;
	}

	if ((mu1 >= 0 && mu1 <= 1) && (mu2 < 0 || mu2 > 1)) {
		// Line segment intersects at one point, in which case one value of u will be between 0 and 1 and the other not.
		return mu1;
	}
	if ((mu2 >= 0 && mu2 <= 1) && (mu1 < 0 || mu1 > 1)) {
		// Line segment intersects at one point, in which case one value of u will be between 0 and 1 and the other not.
		return mu2;
	}

	// Line segment intersects at two points, in which case both values of u will be between 0 and 1.
	return Math.min(mu1, mu2);
}

const circleCircle = (x0, y0, r0, x1, y1, r1) => {
	let a, dx, dy, d, h, rx, ry;
	let x2, y2;

	/* dx and dy are the vertical and horizontal distances between
	* the circle centers.
	*/
	dx = x1 - x0;
	dy = y1 - y0;

	/* Determine the straight-line distance between the centers. */
	d = Math.sqrt((dy * dy) + (dx * dx));
	// d = hypot(dx, dy); // Suggested by Keith Briggs

	/* Check for solvability. */
	if (d > (r0 + r1)) {
		/* no solution. circles do not intersect. */
		return -2;
	}
	if (d < Math.abs(r0 - r1)) {
		/* no solution. one circle is contained in the other */
		return -1;
	}
	if (d === 0 && r0 === r1) {
		/* the circles are coincident and there are an infinite number of solutions. */
		return 0;
	}

	/* 'point 2' is the point where the line through the circle
	* intersection points crosses the line between the circle
	* centers.  
	*/

	/* Determine the distance from point 0 to point 2. */
	a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

	/* Determine the coordinates of point 2. */
	x2 = x0 + (dx * a / d);
	y2 = y0 + (dy * a / d);

	/* Determine the distance from point 2 to either of the
	* intersection points.
	*/
	h = Math.sqrt((r0 * r0) - (a * a));

	/* Now determine the offsets of the intersection points from
	* point 2.
	*/
	rx = -dy * (h / d);
	ry = dx * (h / d);

	/* Determine the absolute intersection points. */

	// computes the angle in radians with respect to the positive x-axis
	const angle2 = Math.atan2(- dy, - dx); // -pi - pi
	const angle1 = (angle2 > 0) ? angle2 - Math.PI : angle2 + Math.PI; // angle2 + Math.PI

	const angleOff1 = Math.asin(h / r0);
	const angleOff2 = (r0 === r1) ? angleOff1 : Math.asin(h / r1);
	const result = {
		intersect1: {
			x: x2 + rx,
			y: y2 + ry
		},
		intersect2: {
			x: x2 - rx,
			y: y2 - ry
		},
		angle1: angle1,
		angle2: angle2,
		angleOff1: angleOff1,
		angleOff2: angleOff2

	};
	return result;
}

class Wall {
	constructor(radius = 0.5) {
		this.radius = radius;
		this.points = [];
	}
}

const PI_2 = Math.PI * 2;
class Clip {
	constructor(intersect1, intersect2, angle, angleOff) {
		this.startAngle = angle - angleOff;
		this.endAngle = angle + angleOff;
		this.startPoint = intersect1;
		this.endPoint = intersect2;

		if (this.startAngle < 0) {
			this.startAngle += PI_2;
			this.endAngle += PI_2;
		}
	}
}
class Arc {
	constructor(startAngle, startPoint, endAngle, endPoint) {
		if (endAngle > PI_2) endAngle -= PI_2;
		this.startAngle = startAngle;
		this.startPoint = startPoint;
		this.endAngle = endAngle;
		this.endPoint = endPoint;
	}
}

const insideArc = (angle, start, end) => {
	if (start < end) {
		return (angle > start && angle < end);
	} else {
		return (angle > start || angle < end);
	}
}

class BoundPoint {
	constructor(point, radius = 0.5) {
		this.radius = radius;
		this.point = point;
		this.clips = [];
		this.arcs = null;
	}
	removeOverlaps() {
		if (this.clips.length < 2) return;

		this.clips.sort((a, b) => {
			return a.startAngle - b.startAngle;
		});

		let prev = this.clips[0];
		const clips = null;
		for (const clip of this.clips) {
			if (!clips) {
				clips = [prev];
				continue;
			}
			if (clip.startAngle > prev.endAngle) {
				clips.push(clip);
			} else {
				if (clip.endAngle > prev.endAngle) {
					prev.endAngle = clip.endAngle;
					prev.endPoint = clip.endPoint;
				}
			}
			prev = clip;
		}
		this.clips = clips;
	}
	addClip(intersect1, intersect2, angle, angleOff) {
		const clip = new Clip(intersect1, intersect2, angle, angleOff);
		if (!this.arcs) {
			const arc = new Arc(clip.endAngle, clip.endPoint, clip.startAngle, clip.startPoint);
			this.arcs = [arc];
			return;
		}
		for (const arc of this.arcs) {
			const startInside = insideArc(clip.startAngle, arc.startAngle, arc.endAngle);
			const endInside = insideArc(clip.endAngle, arc.startAngle, arc.endAngle);
			if (startInside && endInside) {


			}
			if (startInside && !endInside) {
				arc.endAngle = clip.startAngle;
				arc.endPoint = clip.startPoint;
			}
			if (!startInside && endInside) {
				arc.startAngle = clip.endAngle;
				arc.startPoint = clip.endPoint;
			}
		}
	}
	generatePath() {
		// const segment = thetaStart + s / segments * thetaLength;

		// // vertex

		// vertex.x = radius * Math.cos( segment );
		// vertex.y = radius * Math.sin( segment );

		const startClip = this.clips[this.clips.length - 1];
		const endClip = this.clips[0];
		for (const clip of this.clips) {
			const path = [];

			clip.startAngle = add.startAngle;
			clip.startPoint = add.startPoint;
			clip.endAngle = add.endAngle;
			clip.endPoint = add.endPoint;

			const ray1 = new Vector2().subVectors(prevLine.end, line.baseStart);
			const ray2 = new Vector2().subVectors(line.start, line.baseStart);
		}
		this.radius = radius;
		this.point = point;

		const angle = ray1.angleTo(ray2);
		const segRad = 5 * Math.PI / 180 / radiusSquareRoot;
		const segments = Math.ceil(angle / segRad);

		prevPoint = prevLine.end;
		if (segments > 1) {
			const cross = ray1.clone().cross(ray2).normalize();
			const segAngle = angle / segments;
			for (let i = 1; i < segments; i++) {
				const ray = ray1.clone();
				const degree = i / segments;
				ray.y = ray1.y * (1 - degree) + ray2.y * degree;
				ray.applyAxisAngle(cross, segAngle * i);
				ray.add(line.baseStart);

				const lineInset = new Line2(prevPoint, ray);
				linesInsetCurved.push(lineInset);
				prevPoint = ray;
			}
		}

		const lineInset = new Line2(prevPoint, line.start);
	}
}

export class Walls {
	constructor() {
		this.walls = [];
	}
	static segmentSegment(s1_1, s1_2, s2_1, s2_2) {
		const mua = segmentSegment(s1_1.x, s1_1.y, s1_2.x, s1_2.y, s2_1.x, s2_1.y, s2_2.x, s2_2.y);
		if (mua === -1) return mua;
		if (mua === -2) return mua;

		const x = s1_1.x + mua * (s1_2.x - s1_1.x);
		const y = s1_1.y + mua * (s1_2.y - s1_1.y);
		// const point = new Vector2(x, y);
		return mua;
	}
	static segmentCircle(p1, p2, c, r) {
		const mua = segmentCircle(p1.x, p1.y, p2.x, p2.y, c.x, c.y, r);
		if (mua === -1) return mua;
		if (mua === -2) return mua;

		const x = p1.x + mua * (p2.x - p1.x);
		const y = p1.y + mua * (p2.y - p1.y);
		// const point = new Vector2(x, y);
		return mua;
	}
	static circleCircle(c1, c2, r) {
		return circleCircle(c1.x, c1.y, r, c2.x, c2.y, r);
	}
	processWalls() {
		const boundry = [];
		for (const wall of this.walls) {
			if (wall.points.length === 0) continue;
			const bound = new BoundPoint(wall.points[0], wall.radius);
			boundry.push(bound);
		}

		const len = boundry.length;
		for (let i1 = 0; i1 < len; i1++) {
			const bound1 = boundry[i1];

			for (let i2 = i1 + 1; i2 < len; i2++) {
				const bound2 = boundry[i2];

				const result = circleCircle(bound1.point.x, bound1.point.y, bound1.radius, bound2.point.x, bound2.point.y, bound2.radius);
				if (result === 0) continue;
				if (result === -1) continue;
				if (result === -2) continue;

				bound1.addClip(result.intersect1, result.intersect2, angle1, angleOff1);
				bound2.addClip(result.intersect1, result.intersect2, angle2, angleOff2);
			}
		}

		for (const bound of boundry) {
			const clips = bound.clips;
			clips.sort((a, b) => {
				const aMin = a.angle - a.angleOff;
				const bMin = b.angle - b.angleOff;
				return aMin - bMin;
			});
		}
	}
}
