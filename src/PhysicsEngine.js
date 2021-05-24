/*
	all physics related stuff
*/

import C from './Constants';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import PhysicsObject from './PhysicsObject';
import Wall from './Wall';

import Ground from './Ground';
import getToonMaterial from './ToonMaterial';
import { choice } from './Cool';
import { bodyToMesh } from './lib/three-conversion-utils.js';

export default function Physics(scene, ground) {

	const world = new CANNON.World();
	const dt = 1 / 60;
	let lastTime = performance.now();
	let wallBodies = []; // dont need this if walls dont move

	world.defaultContactMaterial.contactEquationStiffness = 1e9;
	world.defaultContactMaterial.contactEquationRelaxation = 4;
	world.gravity.set(0, -30, 0);
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

	// const physicsMaterial = new CANNON.Material('physics');
	// const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
	// 	friction: 0.1,
	// 	restitution: 0.3,
	// });

	// world.addContactMaterial(physics_physics);

	// scene.add(new THREE.AxesHelper(3)); // center of scene

	world.addBody(ground.body);


	this.addWall = function(x, y, z, h, postHeight, rotation, isRock) {
		const body = new CANNON.Body({ mass: 0, material: new CANNON.Material() })
		body.position.set(x, y + h * postHeight / 2, z);
		body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), rotation - Math.PI / 2);
		const shape = new CANNON.Box(new CANNON.Vec3(C.sideLength / 2, h * postHeight / 2, isRock ? 1 : 0.5));
		body.addShape(shape);
		world.addBody(body);
		wallBodies.push(body);
	};
	
	this.addBody = function(body) {
		world.addBody(body);
	};

	this.update = function(time) {
		world.step(dt);
	};


	this.reset = function() {
		for (let i = 0; i < wallBodies.length; i++) {
			world.removeBody(wallBodies[i]);
		}
		wallBodies = [];
	};
}