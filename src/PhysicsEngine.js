/*
	all physics related stuff
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import PhysicsObject from './PhysicsObject';
import Wall from './Wall';

import Ground from './Ground';
// import Ground from './GroundFlat';

export default function Physics(scene, ground, hexMap, sideLength, models) {

	const castList = []; // so character knows whens its on the ground -- raycast

// world setup
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

	// const physicsMaterial = new CANNON.Material('physics');
	// const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
	// 	friction: 0.1,
	// 	restitution: 0.3,
	// });

	// world.addContactMaterial(physics_physics);

	// scene.add(new THREE.AxesHelper(3)); // center of scene

// grund
	world.addBody(ground.body);
	addToCastList(ground.mesh);

// hex walls
	const wallBodies = []; // dont need this if walls dont move
	const walls = hexMap.getWalls(sideLength);
	walls.forEach(params => {
		// const wall = new Wall(params, sideLength, models, ground, false);
		// scene.add(wall.container);
		// world.addBody(wall.body);
		// addToCastList(wall.container);
		// scene.add(wall.bodyMesh); // debug
	});

// physis
	function addToCastList(mesh) {
		mesh.traverse(child => {
			if (child.constructor.name == 'Mesh') {
				castList.push(child);
			}
		});
	}

	this.addBody = function(body) {
		world.addBody(body);
	};

	this.getCastList = function() {
		return castList;
	};

	this.update = function(time) {
		world.step(dt);
	};
}