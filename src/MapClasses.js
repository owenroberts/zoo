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
}

export { Hexagon, Axial, Cube };