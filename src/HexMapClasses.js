/*
	map classes
*/

class Axial {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	toCube() {
		return new Cube(this.x, -this.x - this.y, this.y);
	}

	getKey() {
    	return `${this.x} x ${this.y}`;
  	}

	compareTo(other) {
    	return (this.x == other.x && this.y == other.y);
  	}

	calculatePosition(w, h) {
		if (h === undefined) { // just given side length
			w = w * 2;
			h = Math.sqrt(3) / 2 * w;
		}
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

	toAxial() {
		return new Axial(this.x, this.z);
	}

	round() {
		let [cx, cy, cz] = [this.x, this.y, this.z];
		this.x = Math.round(cx);
		this.y = Math.round(cy);
		this.z = Math.round(cz);

		let xDiff = Math.abs(this.x - cx);
		let yDiff = Math.abs(this.y - cy);
		let zDiff = Math.abs(this.z - cz);

		if (xDiff > yDiff && xDiff > zDiff) {
			this.x = -this.y - this.z;
		} else if (yDiff > zDiff) {
			this.y = -this.x - this.z;
		} else {
			this.z = -this.x - this.y
		}
		return this;
	}
}

class Hexagon extends Axial {
	constructor(x, y) {
		super(x, y);
		this.visited = false;
		
		// SE, S, SW, NW, N, NE
		this.walls = [false, false, false, false, false, false];
		
		/*
			makes walls around center and then petaling out, no doubles
			based on staring at x = 1, top and going around, probably ways to reduce mathematically ...
		*/
		
		let c = this.toCube();
		this.walls[0] = c.y <= 0;
		this.walls[1] = c.z >= 0;
		this.walls[2] = c.x <= 0;
		this.walls[3] = c.y >= 0;
		this.walls[4] = c.z <= 0;
		this.walls[5] = c.x >= 0;
	}

	getDirection(hex) {
		let [x, y] = [hex.x - this.x, hex.y - this.y];
		if (x == 1 && y == 0) return 'SE';
		if (x == 1 && y == -1) return 'NE';
		if (x == 0 && y == -1) return 'N';
		if (x == -1 && y == 0) return 'NW';
		if (x == -1 && y == 1) return 'SW';
		if (x == 0 && y == 1) return 'S';
	}
}

export { Hexagon, Axial, Cube };