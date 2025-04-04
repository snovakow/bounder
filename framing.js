import { Vector3 } from 'three';

class FrameArray extends Array {
    constructor(...args) {
        super(...args);
        this.focusIndex = -1;
    }
    focusNode(framingNode) {
        for (const [i, node] of this.entries()) {
            if (node === framingNode) {
                this.focusIndex = i;
                return true;
            }
        }
        this.focusIndex = -1;
        return false;
    }
    isNode() {
        if (this.focusIndex < 0) return false;
        return index % 2 === 0;
    }
    isLink() {
        if (this.focusIndex < 0) return false;
        return index % 2 === 1;
    }
    nextNode() {
        if (this.isNode && this.focusIndex < this.length - 2) return this[this.focusIndex + 2];
        if (this.isLink && this.focusIndex < this.length - 1) return this[this.focusIndex + 1];
        return null;
    }
    prevNode() {
        if (this.isNode && this.focusIndex > 1) return this[this.focusIndex - 2];
        if (this.isLink && this.focusIndex > 0) return this[this.focusIndex - 1];
        return null;
    }
    nextLink() {
        if (this.isNode && this.focusIndex < this.length - 1) return this[this.focusIndex + 1];
        return null;
    }
    prevLink() {
        if (this.isNode && this.focusIndex > 0) return this[this.focusIndex - 1];
        return null;
    }
}

const up = new Vector3(0, 1, 0);
Object.freeze(up);
const placeLink = (link, node1, node2) => {
    const ray = node1.position.clone();
    ray.sub(node2.position);

    const unitRay = ray.clone().normalize();
    ray.multiplyScalar(0.5);

    link.quaternion.setFromUnitVectors(up, unitRay);
    link.position.copy(node2.position);
    link.position.add(ray);

    link.scale.y = node2.position.distanceTo(node1.position);
}

export { FrameArray, placeLink };