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

function Physics(scene, player, models) {

	const castList = []; // so character knows whens its on the ground -- raycast
	const letters = 'abcdefghijklmnopqrstuvwxyz';
	
	const world = new CANNON.World();
	world.defaultContactMaterial.contactEquationStiffness = 1e9;
	world.defaultContactMaterial.contactEquationRelaxation = 4;
	world.gravity.set(0, -20, 0);
	world.broadphase = new CANNON.SAPBroadphase(world);

	console.log(world);

	world.quatNormalizeFast = true;
	world.quatNormalizeSkip = 8;
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

	scene.add(new THREE.AxesHelper(3));

	const ground = new Ground(physicsMaterial);
	world.addBody(ground.body);
	scene.add(ground.mesh);
	ground.mesh.traverse(child => {
		if (child.constructor.name == 'Mesh') castList.push(child);
	});

	const bodies = [];
	
	const hexMap = new HexMap(3);
	const sideLength = 20;
	const walls = hexMap.getWalls(sideLength);
	let letterCount = 0;
	walls.forEach(w => {
		for (let x = -sideLength / 2; x < sideLength / 2; x += 2) {
			letterCount++;
			const letter = choice(...letters.split(''));
			const wall = new Letter({
				model: models.letters[letter].clone(),
				mass: 5,
				position: [w.x + x, 0, w.z],
				rotation: w.rotation,
				helper: false,
			});
			world.addBody(wall.body);
			scene.add(wall.container);
			bodies.push(wall);
			wall.mesh.traverse(child => {
				if (child.constructor.name == 'Mesh') castList.push(child);
			});
		}
	});
	console.log(letterCount);

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