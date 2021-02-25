/*
	makes the scene mesh and physics body and updates
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class PhysicsObject {
	constructor(params) {

		const halfExtents = new CANNON.Vec3(params.size, params.size, params.size);
		const shape = new CANNON.Box(halfExtents);
		const geo = new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);

		this.body = new CANNON.Body({ mass: params.mass });
		this.body.addShape(shape);
		this.body.position.set(...params.position);

		this.mesh = new THREE.Mesh(geo, params.material);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		this.mesh.position.copy(this.body.position);
	}

	update() {
		this.mesh.position.copy(this.body.position);
		this.mesh.quaternion.copy(this.body.quaternion);
	}
}