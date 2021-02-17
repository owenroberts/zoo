/*
	all physics related stuff
	how to get player in here ... ?
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

function Physics(scene) {
	
	const material = new THREE.MeshLambertMaterial({ color: 0xdddddd });
	const world = new CANNON.World();
	world.defaultContactMaterial.contactEquationStiffness = 1e9;
	world.defaultContactMaterial.contactEquationRelaxation = 4;
	world.gravity.set(0, -20, 0);

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

	// this just matches the floor?
	const groundShape = new CANNON.Plane();
	const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
	groundBody.addShape(groundShape);
	groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
	world.addBody(groundBody);

	const boxBodies = [];
	const boxMeshes = [];
	const halfExtents = new CANNON.Vec3(1, 1, 1);
	const boxShape = new CANNON.Box(halfExtents);
	const boxGeometry = new THREE.BoxBufferGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);

	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 10; j++) {
			const boxBody = new CANNON.Body({ mass: 0 });
			boxBody.addShape(boxShape);
			const boxMesh = new THREE.Mesh(boxGeometry, material);
			boxBody.position.set(i * 2, j * 2, -10);
			boxMesh.position.copy(boxBody.position);
			boxMesh.castShadow = true;
			boxMesh.receiveShadow = true;
			world.addBody(boxBody);
			scene.add(boxMesh);
			boxBodies.push(boxBody);
			boxMeshes.push(boxMesh);
		}
	}

	this.addBody = function(body) {
		world.addBody(body);
	};

	this.update = function(characterPosition) {
		world.step(dt);
		// Update box positions
		for (let i = 0; i < boxBodies.length; i++) {
			boxMeshes[i].position.copy(boxBodies[i].position);
			boxMeshes[i].quaternion.copy(boxBodies[i].quaternion);
		}

	};
}

export { Physics };