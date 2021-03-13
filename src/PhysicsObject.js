/*
	makes the scene mesh and physics body and updates
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { bodyToMesh } from './lib/three-conversion-utils.js';

export default class PhysicsObject {
	constructor(params) {

		const halfExtents = new CANNON.Vec3(params.size, params.size, params.size);
		const shape = new CANNON.Box(halfExtents);
		this.body = new CANNON.Body({ mass: params.mass });
		this.body.addShape(shape);
		this.body.position.set(...params.position);

		this.mesh = bodyToMesh(this.body, params.material);
		this.mesh.traverse((child) => {
			if (child.constructor.name == 'Mesh') {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		this.mesh.position.copy(this.body.position);
	}

	update() {
		this.mesh.position.copy(this.body.position);
		this.mesh.quaternion.copy(this.body.quaternion);
	}
}