/*
	all physics related stuff
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import PhysicsObject from './PhysicsObject';
import Ground from './Ground'
import Letter from './Letter';
import { choice, random } from './Cool';
import HexMap from './HexMap';

function Physics(scene, models) {

	const castList = []; // so character knows whens its on the ground -- raycast
	const letters = 'abcdefghijklmnopqrstuvwxyz';
	
	const world = new CANNON.World();
	world.defaultContactMaterial.contactEquationStiffness = 1e9;
	world.defaultContactMaterial.contactEquationRelaxation = 4;
	world.gravity.set(0, -20, 0);
	world.broadphase = new CANNON.SAPBroadphase(world);
	world.allowSleep = true; // not sure what this means ... 

	const solver = new CANNON.GSSolver();
	solver.iterations = 7;
	solver.tolerance = 0.1;
	world.solver = new CANNON.SplitSolver(solver);
	// use this to test non-split solver;
	// world.solver = solver;

	const dt = 1 / 60;
	let lastTime = performance.now();

	const physicsMaterial = new CANNON.Material('physics');
	const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
		friction: 0.1,
		restitution: 0.3,
	});

	world.addContactMaterial(physics_physics);

	const ground = new Ground(physicsMaterial);
	world.addBody(ground.body);
	scene.add(ground.mesh);
	ground.mesh.traverse(child => {
		if (child.constructor.name == 'Mesh') castList.push(child);
	});

	const bodies = [];
	
	// for (let i = 0; i < 10; i += 2) {
	// 	for (let j = 0; j < 1; j += 2) {
	// 		const letter = choice(...letters.split(''));
	// 		const box = new Letter({
	// 			model: models.letters[letter].clone(),
	// 			mass: 5,
	// 			position: [i * 2, 0.5 + j * 2, 10],
	// 			size: 1,
	// 			helper: true,
	// 		});
	// 		world.addBody(box.body);
	// 		scene.add(box.container);
	// 		scene.add(box.helper);
	// 		box.mesh.traverse(child => {
	// 			if (child.constructor.name == 'Mesh') castList.push(child);
	// 		});
	// 		bodies.push(box);
	// 	}
	// }

	const mapCenter = new THREE.AxesHelper(3);
	scene.add(mapCenter);

	const hexMap = new HexMap(3);
	const hexes = hexMap.getHexes();
	const side = 20;
	for (let i = 0; i < hexes.length; i++) {
		const hex = hexes[i];
		const width = side * 2;
		const height = Math.sqrt(3) / 2 * width;
		let { x, y } = hex.calculatePosition(width, height);
		const points = [];
		for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 6) {
			let sx = x + Math.cos(a) * side;
			let sy = y + Math.sin(a) * side;
			points.push(new THREE.Vector3(sx, 0, sy));
		}
		for (let j = 0; j < points.length - 1; j++) {
			if (hex.walls[j]) {
				const h = random(10, 20);
				const wall = new THREE.Mesh(
					new THREE.BoxGeometry( 1, h, side ),
					new THREE.MeshBasicMaterial( { color: 0x00ffff, wireframe: true }),
				);
				
				let x = (points[j].x + points[j + 1].x) / 2;
				let z = (points[j].z + points[j + 1].z) / 2;
				wall.position.set(x, 0, z);
				wall.rotation.y = (j + (j + 1)) * Math.PI * 1 / 6 * -1;
				// scene.add(wall);

				const wallObject = new PhysicsObject({
					size: { x: 1, y: h, z: side },
					mass: 0,
					position: [x, 0, z],
					rotation: (j + (j + 1)) * Math.PI * 1 / 6 * -1,
				});
				world.addBody(wallObject.body);
				scene.add(wallObject.mesh);
				bodies.push(wallObject);
				wallObject.mesh.traverse(child => {
					if (child.constructor.name == 'Mesh') castList.push(child);
				});
			}
		}
	}


	this.getCastList = function() {
		return castList;
	};

	this.addBody = function(body) {
		world.addBody(body);
	};

	this.playerRayCast = function(start, end, rayCastOptions, rayResult) {
		return world.raycastClosest(start, end, rayCastOptions, rayResult);
	};

	this.update = function() {
		world.step(dt);
		for (let i = 0; i < bodies.length; i++) {
			bodies[i].update();
		}
	};
}

export { Physics };