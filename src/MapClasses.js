/*
	map classes
*/
import { choice } from './Cool';

class Axial {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	toCube() {
		return new Cube(this.x, -this.x - this.y, this.y);
	}

	compareTo(other) {
    	return (this.x == other.x && this.y == other.y);
  	}

	calculatePosition(w, h) {
		let c = this.toCube();
		return { 
      		x: Math.round(c.x * w * 3/4), 
      		y: Math.round((c.z + c.x / 2) * h),
    	};
	}
}

class Cube {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z || -x-y;
	}
}


class Hexagon extends Axial {
	constructor(x, y) {
		super(x, y);
		this.visited = false;
		
		// SE, S, SW, NW, N, NE
		this.walls = [false, false, false, false, false, false];
		let c = this.toCube();
		if (c.y <= 0) this.walls[0] = true;
		if (c.z >= 0) this.walls[1] = true;
		if (c.x <= 0) this.walls[2] = true;
		if (c.y >= 0) this.walls[3] = true;
		if (c.z <= 0) this.walls[4] = true;
		if (c.x >= 0) this.walls[5] = true;
		// makes walls around center and then petaling out, no doubles
		// based on staring at x = 1, top and going around, probably ways to reduce mathematically ...

	}

	getNeighbor(map) {
		const neighbors = map.getNeighbors(this)
			.filter(n => !n.visited);
		return choice(...neighbors);
	}
}

export { Hexagon, Axial, Cube };