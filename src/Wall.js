/*
	hex wall made of lines of letters ...
*/
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { choice, random, chance } from './Cool';
import getToonMaterial from './ToonMaterial';
import { bodyToMesh } from './lib/three-conversion-utils.js';
import C from './Constants';

export default class Wall {
	constructor(params, modelLoader, ground, labelWall, showHelper) {
		const self = this;
		const { x, z, rotation, key, distance, arrow } = params;
		const y = 4; // ground.getClosestVert(x, z);
		const h = distance + 1;
		const postHeight = 2.8;
		const isRock = distance == 3 || chance(0.4);

		this.container = new THREE.Group();
		this.container.position.set(x, y, z);
		this.container.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), params.rotation - Math.PI / 2);


		if (showHelper) {
			this.bodyMesh = bodyToMesh(
				this.body, 
				new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true }),
			);
			this.bodyMesh.position.copy(this.body.position);
			this.bodyMesh.quaternion.copy(this.body.quaternion);
			this.container.add(new THREE.AxesHelper(2));
		}

	}
}