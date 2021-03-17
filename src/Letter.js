/*
	add a letter with a physics body
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import getToonMaterial from './ToonMaterial';

export default class Letter {
	constructor(params) {

		this.container = new THREE.Group();


		this.mesh = params.model;
		this.mesh.traverse(child => {
			if (child.constructor.name == 'Mesh') {
				child.castShadow = true;
				child.receiveShadow = true;
				child.material = getToonMaterial({
					color: 0x6f6c82,
				});
			}
		});
		this.container.add(this.mesh);

		const box = this.mesh.children[0].geometry.boundingBox;
		const size = new THREE.Vector3(
			box.max.x - box.min.x, 
			box.max.y - box.min.y, 
			box.max.z - box.min.z,
		);
		this.mesh.position.y -= size.y / 2;

		if (params.helper) {
			this.helper = new THREE.Mesh(
				new THREE.BoxGeometry( size.x, size.y, size.z ),
				new THREE.MeshBasicMaterial( { color: 0x00ffff, wireframe: true }),
			);
		}

		const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
		const shape = new CANNON.Box(halfExtents);
		this.body = new CANNON.Body({ mass: params.mass });
		this.body.addShape(shape);
		this.body.position.set(...params.position);

		this.update();

	}

	update() {
		this.container.position.copy(this.body.position);
		this.container.quaternion.copy(this.body.quaternion);

		if (this.helper) {
			this.helper.position.copy(this.body.position);
			this.helper.quaternion.copy(this.body.quaternion);
		}
	}
}