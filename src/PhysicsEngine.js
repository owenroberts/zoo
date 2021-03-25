/*
	all physics related stuff
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import PhysicsObject from './PhysicsObject';
import Letter from './Letter';
import { choice, random } from './Cool';
import HexMap from './HexMap';
// import Ground from './Ground';
import Ground from './GroundFlat';


function Physics(scene, models) {

	const castList = []; // so character knows whens its on the ground -- raycast
	const letters = 'abcdefghijklmnopqrstuvwxyz';
	
	const world = new CANNON.World();
	world.defaultContactMaterial.contactEquationStiffness = 1e9;
	world.defaultContactMaterial.contactEquationRelaxation = 4;
	world.gravity.set(0, -20, 0);
	world.broadphase = new CANNON.SAPBroadphase(world);

	world.quatNormalizeFast = true;
	world.quatNormalizeSkip = 8;
	world.allowSleep = true; // not sure what this means ... 
	console.log(world);

	const solver = new CANNON.GSSolver();
	solver.iterations = 7;
	solver.tolerance = 0.01;
	// world.solver = solver; 	// use this to test non-split solver;
	world.solver = new CANNON.SplitSolver(solver);

	

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

	const wallBodies = [];
	
	const hexMap = new HexMap(3);
	const sideLength = 20;
	const walls = hexMap.getWalls(sideLength);
	walls.forEach(w => {
		for (let x = -sideLength / 2; x < sideLength / 2; x += 2) {
			const letter = choice(...letters.split(''));
			const wall = new Letter({
				model: models.letters[letter].clone(),
				mass: 5,
				position: [w.x + x, 0, w.z],
				// position: [w.x, 0, w.z],
				rotation: w.rotation,
				helper: false,
			});
			wall.key = w.key;
			wall.body.collisionFilterGroup = 4;
			wall.body.collisionFilterMask = 1;
			world.addBody(wall.body);
			scene.add(wall.container);
			wallBodies.push(wall);
			wall.mesh.traverse(child => {
				if (child.constructor.name == 'Mesh') castList.push(child);
			});
		}
	});

	this.addBody = function(body) {
		world.addBody(body);
	};

	this.getCastList = function() {
		return castList;
	};

	this.update = function(time, playerPosition) {
		
		const hexKeys = hexMap.getHexAndNeighbors(playerPosition.x, playerPosition.z, sideLength);
		const nearByWalls = wallBodies.filter(b => hexKeys.includes(b.key));
		for (let i = 0; i < nearByWalls.length; i++) {
			nearByWalls[i].body.collisionFilterGroup = 1;
			nearByWalls[i].body.mass = 5;
		}

		world.step(dt);

		for (let i = 0; i < nearByWalls.length; i++) {
			nearByWalls[i].body.collisionFilterGroup = 4;
			nearByWalls[i].body.mass = 0;
			nearByWalls[i].update();
		}

		// for (let i = 0; i < wallBodies.length; i++) {
		// 	nearByWalls[i].update();
		// }

	};
}

export { Physics };