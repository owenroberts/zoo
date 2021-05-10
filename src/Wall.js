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
	constructor(params, modelLoader, ground, showHelper) {
		const { x, z, rotation, key, distance } = params;
		const y = 4; // ground.getClosestVert(x, z);
		const h = distance + 1;
		const postHeight = 2.8;

		this.container = new THREE.Group();
		this.container.position.set(x, y, z);
		this.container.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), params.rotation - Math.PI / 2);

		this.body = new CANNON.Body({ mass: 0, material: new CANNON.Material() })
		this.body.position.set(x, y + h * postHeight / 2, z);
		this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), params.rotation - Math.PI / 2);
		const shape = new CANNON.Box(new CANNON.Vec3(C.sideLength / 2, h * postHeight / 2, 0.25));
		this.body.addShape(shape);
		

		const dummy = new THREE.Object3D();
		for (let j = 0; j < h; j++) {

			dummy.position.set(x, y, z);
			dummy.quaternion.copy(this.container.quaternion);
			dummy.translateX(-C.sideLength / 2);
			dummy.translateY(j * postHeight);
			
			for (let i = 0; i < 3; i++) {

				dummy.updateMatrix();
				modelLoader.addInstance('post', 'random', dummy.matrix);
				
				if (i < 2) {
					dummy.translateY(0.2);
					for (let i = 0; i < 8; i++) {
						dummy.updateMatrix();
						if (chance(0.9)) modelLoader.addInstance('cross', 'random', dummy.matrix);
						dummy.translateY(0.33);
					}
				}

				dummy.translateX(C.sideLength / 2);
				dummy.position.y = y + j * postHeight;
			}
		}


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