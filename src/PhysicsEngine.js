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

export default function Physics(scene, ground, hexMap, models) {

	const castList = []; // so character knows whens its on the ground -- raycast

	const world = new CANNON.World();
	const dt = 1 / 60;
	let lastTime = performance.now();
	const wallBodies = []; // dont need this if walls dont move

	const sphereShape = new CANNON.Sphere(2);
	const physicsMaterial = new CANNON.Material();
	const body = new CANNON.Body({ mass: 5 });

	function setupWorld() {

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

		scene.add(new THREE.AxesHelper(3)); // center of scene

		world.addBody(ground.body);
		addToCastList(ground.mesh);
	}

	function setupWalls() {

		// const walls = hexMap.getWalls(C.sideLength);
		hexMap.getHexes().forEach(hex => {
			let walls = hexMap.getWalls(hex, C.sideLength);
			let labelWall;
			if (hex.getKey() == '0 x 0') {
				labelWall = choice(...walls);
			}
			for (let i = 0; i < walls.length; i++) {
				const wall = new Wall(walls[i], models, ground, walls[i] == labelWall, true);
				world.addBody(wall.body);

				// scene.add(wall.container);
				// addToCastList(wall.container);
				// scene.add(wall.bodyMesh); // debug
			}
		});

		// for (const m in meshes) {
		// 	meshes[m].mesh.count = meshes[m].count;
		// 	if (meshes[m].count > 0) {
		// 		// scene.add(meshes[m].mesh);
		// 		addToCastList(meshes[m].mesh);
		// 	}
		// }
		models.updateCount('rocks');
	}

	function addToCastList(mesh) {
		mesh.traverse(child => {
			if (child.constructor.name == 'Mesh') {
				castList.push(child);
			}
		});
	}

	setupWorld();
	setupWalls();

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