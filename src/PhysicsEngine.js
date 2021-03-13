/*
	all physics related stuff
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import PhysicsObject from './PhysicsObject';
import Ground from './Ground'

function Physics(scene) {

	const castList = []; // so character knows whens its on the ground -- raycast
	
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
		friction: 0.0,
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
	const material = new THREE.MeshLambertMaterial({ color: 0x222222 });
	for (let i = 0; i < 10; i += 2) {
		for (let j = 0; j < 1; j += 2) {
			const box = new PhysicsObject({
				mass: 0,
				material: material,
				position: [i * 2, 0.5 + j * 2, 10],
				size: 1,
			});
			world.addBody(box.body);
			scene.add(box.mesh);
			box.mesh.traverse(child => {
				if (child.constructor.name == 'Mesh') castList.push(child);
			});
			bodies.push(box);
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