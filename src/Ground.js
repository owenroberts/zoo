/*
	generate ground mesh and physics
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { bodyToMesh } from './lib/three-conversion-utils.js';
import { choice, random, map } from './Cool';
// import Noise from './lib/perlin.js';

export default function Ground() {

	let groundHeight = 3;
	let xRandom = 4;
	let yRandom = 4;
	const sizeX = 16;
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

			const height = 	Math.sin((i / sizeX) * Math.PI * xRandom) * 
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
		elementSize: 256 / sizeX,
	});
	this.body = new CANNON.Body({ mass: 0 });
	this.body.addShape(heightfieldShape);
	this.body.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
	this.body.position.set(
		(-(sizeX - 1) * heightfieldShape.elementSize) / 2,
		groundHeight * 2 - 3,
		((sizeZ - 1) * heightfieldShape.elementSize) / 2,
	);

	const texture = new THREE.TextureLoader().load(`./static/textures/ground-${choice(1,2,3,4,5)}.png`);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 128, 128 );
	texture.anisotropy = 16;
	texture.encoding = THREE.sRGBEncoding;

	const groundMat = new THREE.MeshPhongMaterial({ 
		color: 0xffffff,
		map: texture,
	});
	groundMat.color.setHSL( 0.095, 1, 0.75 );

	this.mesh = bodyToMesh(this.body, groundMat);
	this.mesh.traverse(child => {
		if (child.constructor.name == 'Mesh') {
			child.receiveShadow = true;
		}
	});

	this.mesh.updateWorldMatrix();
	this.mesh.children[0].geometry.computeFaceNormals();

	const verts = this.mesh.children[0].geometry.vertices.map(_v => {
		const v = _v.clone();
		v.applyMatrix4(this.mesh.matrixWorld);
		return new THREE.Vector3(v.x, v.y, v.z);
	});

	this.getClosestVert = function(x, z) {
		let closestVert, vertDistance;
		for (let i = 0; i < verts.length; i++) {
			const distance = new THREE.Vector3(x, 0, z).distanceTo(verts[i]);
			if (!vertDistance || distance < vertDistance) {
				vertDistance = distance;
				closestVert = verts[i];
			}
		}
		return closestVert.y;
	};

	const groundRaycaster = new THREE.Raycaster();
	const groundRay = new THREE.Vector3(0, -1, 0);

	this.getHeight = function(x, z) {
		groundRaycaster.set(new THREE.Vector3(x, 10, z), groundRay.clone());
		const intersects = groundRaycaster.intersectObjects([this.mesh.children[0]]);
		return intersects[0];
	};
}