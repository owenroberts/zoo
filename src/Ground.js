/*
	generate ground mesh and physics
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { bodyToMesh } from './lib/three-conversion-utils.js';
import { random, map } from './Cool';
// import Noise from './lib/perlin.js';

export default function Ground(physicsMaterial) {

	let groundHeight = 3;
	let xRandom = 4;
	let yRandom = 4;
	const sizeX = 64;
	const sizeZ = sizeX;
	const matrix = [];
	// const noise = new Noise();
	// noise.seed(Math.random());
	for (let i = 0; i < sizeX; i++) {
		matrix.push([]);
		for (let j = 0; j < sizeZ; j++) {
			if (i === 0 || i === sizeX - 1 || 
				j === 0 || j === sizeZ - 1) {
				matrix[i].push(groundHeight);
				continue;
			}

			const height = Math.sin((i / sizeX) * Math.PI * xRandom) * 
							Math.sin((j / sizeZ) * Math.PI * yRandom) * 
							groundHeight + groundHeight;
			xRandom += random(-0.01, 0.01);
			yRandom += random(-0.01, 0.01);
			groundHeight += random(-0.02, 0.02);
			matrix[i].push(height);
		}
	}

	const groundMaterial = new CANNON.Material('ground');
	const heightfieldShape = new CANNON.Heightfield(matrix, {
		elementSize: 300 / sizeX,
	});
	this.body = new CANNON.Body({ mass: 0, material: physicsMaterial });
	this.body.addShape(heightfieldShape);
	this.body.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
	this.body.position.set(
		(-(sizeX - 1) * heightfieldShape.elementSize) / 2,
		-groundHeight * 2,
		((sizeZ - 1) * heightfieldShape.elementSize) / 2,
	);

	const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
	groundMat.color.setHSL( 0.095, 1, 0.75 );

	this.mesh = bodyToMesh(this.body, groundMat);
	this.mesh.traverse(child => {
		if (child.constructor.name == 'Mesh') {
			child.castShadow = true;
			child.receiveShadow = true;
		}
	});
}