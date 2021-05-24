import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Hexagon, Axial, Cube } from './HexMapClasses';
import { choice } from './Cool';

export default function HexMap(radius, isMaze) {
	
	const grid = [];
	for (let x = -radius; x <= radius; x++) {
		for (let y = -radius; y <= radius; y++) {
			for (let z = -radius; z <= radius; z++) {
				if (x + y + z === 0) grid.push(new Hexagon(x, y));
			}
		}
	}

	function buildMaze() {
		const stack = [];
		let current = getHexAt(new Axial(0, 0));
		let next = getNeighbor(current);
		while (next) {
			next.visited = true;
			stack.push(current);
			removeWalls(current, next);
			current = next;
			next = getNeighbor(current);
			while (!next && stack.length > 0) {
				current = stack.pop();
				next = getNeighbor(current);
			}
		}
	}

	function removeWalls(a, b) {
		var d = { x: a.x - b.x, y: a.y - b.y };
		// may not need to remove both walls since im only making one... need to test
		if (d.x === -1 && d.y === 0) {
			a.walls[0] = false;
			b.walls[3] = false;
		}

		if (d.x === 0 && d.y === -1) {
			a.walls[1] = false;
			b.walls[4] = false;
		}

		if (d.x === 1 && d.y === -1) {
			a.walls[2] = false;
			b.walls[5] = false;
		}

		if (d.x === 1 && d.y === 0) {
			a.walls[3] = false;
			b.walls[0] = false;
		}

		if (d.x === 0 && d.y === 1) {
			a.walls[4] = false;
			b.walls[1] = false;
		}

		if (d.x === -1 && d.y === 1) {
			a.walls[5] = false;
			b.walls[2] = false;
		}
	}

	function getHexAt(a) {
		let hex;
		grid.some(h => {
			if (h.compareTo(a)) return hex = h;
		});
		return hex;
	}

	function getNeighbor(hex) {
		return choice(...getNeighbors(hex)
			.filter(n => !n.visited));
	}

	function getNeighbors(a) {
		const neighbors = [];
		// SE, NE, N, NW, SW, S
		const directions = [
			new Axial(a.x + 1, a.y), new Axial(a.x + 1, a.y - 1), new Axial(a.x, a.y - 1), 
      		new Axial(a.x - 1, a.y), new Axial(a.x - 1, a.y + 1), new Axial(a.x, a.y + 1), 
		];

		directions.forEach(dir => {
			let h = getHexAt(dir);
			if (h) neighbors.push(h);
		});

		return neighbors;
	}

	function getDistance(a, b) {
		return (Math.abs(a.x - b.x) 
				+ Math.abs(a.x + a.y - b.x - b.y)
				+ Math.abs(a.y - b.y))
				/ 2;
	}

	function getDistanceToCenter(a) {
		return getDistance(a, new Hexagon(0, 0));
	}

	if (isMaze) buildMaze();

	this.getRing = function(distance) {
		return grid.filter(hex => getDistanceToCenter(hex) == distance);
	};

	this.getHexesByDistance = function(hex, distance) {
		return  grid.filter(h => getDistance(h, hex) == distance);
	};

	this.getHexNeighbors = function(a) {
		return getNeighbors(a);
	};

	this.getWalls = function(hex, sideLength, getAll) {
		const walls = [];
		const width = sideLength * 2;
		const height = Math.sqrt(3) / 2 * width;
		let { x, y } = hex.calculatePosition(width, height);
		const points = []; // these are points of hexagon
		for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 6) {
			let sx = x + Math.cos(a) * sideLength;
			let sy = y + Math.sin(a) * sideLength;
			points.push(new THREE.Vector3(sx, 0, sy));
		}
		for (let j = 0; j < points.length - 1; j++) {
			if (hex.walls[j] || getAll) {
				// this gives the middle point of the wall
				let x = (points[j].x + points[j + 1].x) / 2;
				let z = (points[j].z + points[j + 1].z) / 2;
				let rotation = (j + (j + 1)) * Math.PI * 1 / 6 * -1;
				let distance = getDistance(hex, new Hexagon(0, 0));
				walls.push({ x: x, z: z, rotation: rotation, key: hex.getKey(), distance: distance, hasWall: hex.walls[j] });
			}
		}
		return walls;
	};

	this.getHexAtPosition = function(x, y, sideLength) {
		let _x = x * 2/3 / sideLength;
		let _y = (-x / 3 + Math.sqrt(3)/3 * y) / sideLength;
		let a = new Axial(_x, _y).toCube().round().toAxial();
		return getHexAt(a);
	};

	this.getHexAndNeighbors = function(x, y, sideLength) {
		let hex = this.getHexAtPosition(x, y, sideLength);
		let neighbors = getNeighbors(hex);
		return [hex.getKey(), ...neighbors.map(n => n.getKey())];
	};

	this.getHexes = function() {
		return grid;
	};

	this.drawMap = function(scene, side) {
		for (let i = 0; i < grid.length; i++) {
			const hex = grid[i];
			const width = side * 2;
			const height = Math.sqrt(3) / 2 * width;
			let { x, y } = hex.calculatePosition(width, height);

			const center = new THREE.Mesh(
				new THREE.SphereGeometry( 1, 2, 2 ),
				new THREE.MeshBasicMaterial( { color: 0xff00ff, wireframe: true }),
			);
			center.position.set(x, 0, y);
			scene.add(center);

			const points = [];
			for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 6) {
				let sx = x + Math.cos(a) * side;
				let sy = y + Math.sin(a) * side;
				points.push(new THREE.Vector3(sx, 0, sy));
			}
			const lineGeo = new THREE.BufferGeometry().setFromPoints( points );
			const lineMat = new THREE.LineBasicMaterial( { color: 0x0000ff } );
			const line = new THREE.Line( lineGeo, lineMat );
			scene.add( line );
		}
	};
}

/*
	idea: https://www.redblobgames.com/grids/hexagons/implementation.html
	code: https://github.com/bodinaren/BHex.js
	maze: https://editor.p5js.org/sylvainberube/sketches/doxwlc9US
*/