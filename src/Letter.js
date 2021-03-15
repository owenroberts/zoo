/*
	add a letter with a physics body
*/

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import getToonMaterial from './ToonMaterial';

export default class Letter {
	constructor(params) {


		const halfExtents = new CANNON.Vec3(params.size, params.size, params.size);
		const shape = new CANNON.Box(halfExtents);
		this.body = new CANNON.Body({ mass: params.mass });
		this.body.addShape(shape);
		this.body.position.set(...params.position);

		this.mesh = params.model;
		this.mesh.traverse(child => {
			if (child.constructor.name == 'Mesh') {
				child.castShadow = true;
				child.receiveShadow = true;
				child.material = getToonMaterial({
					color: 0x9a8dd9,
				});
			}
		});

		this.update();

		this.helper = new THREE.BoxHelper(this.mesh);


	}

	update() {
		this.mesh.position.copy(this.body.position);
		this.mesh.quaternion.copy(this.body.quaternion);
	}
}