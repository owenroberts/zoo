/*
	makes the scene mesh and physics body and updates
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import getToonMaterial from './ToonMaterial';
import { bodyToMesh } from './lib/three-conversion-utils.js';

export default class PhysicsObject {
	constructor(params) {

		const halfExtents = new CANNON.Vec3(params.size.x/2, params.size.y/2, params.size.z/2);
		const shape = new CANNON.Box(halfExtents);
		this.body = new CANNON.Body({ mass: params.mass });
		this.body.addShape(shape);
		this.body.position.set(...params.position);

		const material = getToonMaterial({ color: 0x6f6c82 });
		this.mesh = bodyToMesh(this.body, material);
		this.mesh.traverse((child) => {
			if (child.constructor.name == 'Mesh') {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		this.mesh.position.copy(this.body.position);
		this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), params.rotation);
		this.mesh.quaternion.copy(this.body.quaternion);
	}

	update() {
		this.mesh.position.copy(this.body.position);
		this.mesh.quaternion.copy(this.body.quaternion);
	}
}