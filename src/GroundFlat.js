import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { bodyToMesh } from './lib/three-conversion-utils.js';
import { random, map } from './Cool';
// import Noise from './lib/perlin.js';

export default function Ground(physicsMaterial) {

	const groundShape = new CANNON.Plane();
	this.body = new CANNON.Body({ mass: 0, material: physicsMaterial });
	this.body.addShape(groundShape);
	this.body.position.set(0, -2, 0);
	this.body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
	this.body.collisionFilterGroup = 1;
	this.body.collisionFilterMask = 1;

	const groundGeo = new THREE.PlaneGeometry( 10000, 10000 );
	const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
	groundMat.color.setHSL( 0.095, 1, 0.75 );
	this.mesh = new THREE.Mesh( groundGeo, groundMat );
	this.mesh.receiveShadow = true;

	this.mesh.position.copy(this.body.position);
	this.mesh.quaternion.copy(this.body.quaternion);
}
