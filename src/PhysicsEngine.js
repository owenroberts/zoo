/*
	all physics related stuff
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import PhysicsObject from './PhysicsObject';
import Wall from './Wall';
import HexMap from './HexMap';
import Ground from './Ground';
// import Ground from './GroundFlat';


function Physics(scene, models) {

	const castList = []; // so character knows whens its on the ground -- raycast
	
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
	addToCastList(ground.mesh);
	console.log('ground', ground.mesh);
	ground.mesh.updateWorldMatrix();

	let ray = new THREE.Raycaster(new THREE.Vector3(0, 7, 0), new THREE.Vector3(0, -1, 0));
	console.log(ground.mesh.children[0])
	let collisions = ray.intersectObject(ground.mesh.children[0]);
	console.log('collisions', collisions);


	// ground.mesh.children[0].geometry.vertices.forEach(_v => {
	// 	const v = _v.clone();
	// 	v.applyMatrix4(ground.mesh.matrixWorld);
	// 	const ax = new THREE.AxesHelper(1);
	// 	ax.position.set(v.x, v.y, v.z);
	// 	scene.add(ax);
	// });

	const wallBodies = [];
	
	const hexMap = new HexMap(1, false);
	const sideLength = 16;
	const walls = hexMap.getWalls(sideLength);
	walls.forEach(params => {
		const wall = new Wall(params, sideLength, models, ground.mesh, false);
		scene.add(wall.container);
		world.addBody(wall.body);
		// scene.add(wall.bodyMesh);
		// addToCastList(wall.container);
	});

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

	this.update = function(time, playerPosition) {

		let v = new THREE.Vector3(0, 7, 0);// playerPosition.clone();
		// console.log(v);
		let ray = new THREE.Raycaster(v, new THREE.Vector3(0, -1, 0));
		let collisions = ray.intersectObject(ground.mesh.children[0]);
		// console.log('collisions', collisions);
		
		// const hexKeys = hexMap.getHexAndNeighbors(playerPosition.x, playerPosition.z, sideLength);
		// const nearByWalls = wallBodies.filter(b => hexKeys.includes(b.key));
		// for (let i = 0; i < nearByWalls.length; i++) {
		// 	nearByWalls[i].body.collisionFilterGroup = 1;
		// 	nearByWalls[i].body.mass = 5;
		// }

		world.step(dt);

		// for (let i = 0; i < nearByWalls.length; i++) {
		// 	nearByWalls[i].body.collisionFilterGroup = 4;
		// 	nearByWalls[i].body.mass = 0;
		// 	nearByWalls[i].update();
		// }

		// for (let i = 0; i < wallBodies.length; i++) {
		// 	wallBodies[i].update();
		// }

	};
}

export { Physics };