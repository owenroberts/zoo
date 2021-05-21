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

export default function Physics(scene, ground, hexMap, modelLoader) {

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
			if (hex.getKey() == '0 x 0') labelWall = choice(...walls);
			if (hex.isArrowHex) {
				walls[0].arrow = 'left';
				walls[1].arrow = 'right';
				addPortal(walls[0]);
				addPortal(walls[1]);
			}


			for (let i = 0; i < walls.length; i++) {
				const wall = new Wall(walls[i], modelLoader, ground, walls[i] == labelWall, true);
				world.addBody(wall.body);
				if (walls[i].arrow) scene.add(wall.container);
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

	}

	function addPortal(params) {
		const { x, z, rotation } = params;
		const y = ground.getHeight(x, z).point.y;
		const portal = modelLoader.getModel('items', 'portal-3');
		console.log(portal);
		portal.position.set(x, y, z);

		portal.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), rotation - Math.PI / 2);
		portal.translateZ(-1.25);
		portal.translateY(-0.25);

		

		const texture = new THREE.TextureLoader().load(C.portalTexturePath);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(8, 8);

		const material = getToonMaterial({
			color: 0x23630f,
			map: texture,
		});

		const insideMaterial = getToonMaterial({
			color: 0x222421,
			map: texture,
		});


		portal.traverse(child => {
			if (child.constructor.name == 'Mesh') {
				console.log(child);
				// child.material = material;
				child.material = child.material.name == 'Outside' ? material : insideMaterial;
				child.castShadow = true;
			}
		});
		scene.add(portal);

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