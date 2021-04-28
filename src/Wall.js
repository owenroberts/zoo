/*
	hex wall made of lines of letters ...
*/
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { choice, random } from './Cool';
import getToonMaterial from './ToonMaterial';
import { bodyToMesh } from './lib/three-conversion-utils.js';


const beckett = "Where now? Who now? When now? Unquestioning. I, say I. Unbelieving. Questions, hypotheses, call them that. Keep going, going on, call that going, call that on.";
let count = 0;

export default class Wall {
	constructor(params, sideLength, meshes, ground, showHelper) {
		const { x, z, rotation, key } = params;
		const y = ground.getClosestVert(x, z);

		// const distanceFromCenter = new THREE.Vector3(0, 0, 0).distanceTo(new THREE.Vector3(x, 0, z));
		// const h = distanceFromCenter / 5; // probably need a better way to determine this ... 
		let h = key.split(' x ').reduce((n, s) => Math.abs(+n) + Math.abs(+s));
		if (h === 0) h = 1;
		h *= 3;

		this.container = new THREE.Group();
		this.container.position.set(x, y, z);
		this.container.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), params.rotation - Math.PI / 2);

		const groundMaterial = new CANNON.Material('ground')
		this.body = new CANNON.Body({ mass: 0, groundMaterial })
		this.body.position.set(x, y, z);
		this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), params.rotation - Math.PI / 2);
		
		// use rotation of ground?
		
		// letters
		const dummy = new THREE.Object3D();
		
		let _w = 0;
		for (let _y = h - 1; _y > 0; _y -= 2) {
			for (let _x = -sideLength / 2; _x < sideLength / 2 - _w / 2; _x += _w) {
				
				// const letter = choice(...alphabet.split(''));
				const letter = beckett[count].toLowerCase();
				count++;
				if (count >= beckett.length) count = 0;

				if (Object.keys(meshes).includes(letter)) {
					const mesh = meshes[letter].mesh;
					const box = mesh.geometry.boundingBox;
					_w = Math.abs(box.max.x - box.min.x);
					const _h = Math.abs(box.max.y - box.min.y);
					const _d = Math.abs(box.max.z - box.min.z);

					dummy.position.copy(this.body.position);
					dummy.quaternion.copy(this.body.quaternion);
					dummy.translateX(_x + _w / 2);
					dummy.translateY(_y - 2);
					dummy.updateMatrix();
					meshes[letter].mesh.setMatrixAt(meshes[letter].count++, dummy.matrix);
					
					const shape = new CANNON.Box(new CANNON.Vec3(_w / 2, _h / 2, _d / 2));
					this.body.addShape(shape, new CANNON.Vec3(_x + _w / 2, _y - _h / 2, 0));

				}
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