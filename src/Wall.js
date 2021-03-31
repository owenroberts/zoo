/*
	hex wall made of lines of letters ...
*/
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { choice, random } from './Cool';
import getToonMaterial from './ToonMaterial';
import { bodyToMesh } from './lib/three-conversion-utils.js';

const alphabet = 'abcdefghijklmnopqrstuvwxyz';
const beckett = "Where now? Who now? When now? Unquestioning. I, say I. Unbelieving. Questions, hypotheses, call them that. Keep going, going on, call that going, call that on.";
let count = 0;

export default class Wall {
	constructor(params, sideLength, models, groundMesh, showHelper) {
		const { x, z, rotation, key } = params;
		const h = 6;

		this.container = new THREE.Group();
		this.container.position.set(x, 3 + h / 2, z);
		this.container.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), params.rotation - Math.PI / 2);

		this.body = new CANNON.Body({ mass: 0 })
        this.body.position.set(x, 3 + h / 2, z);
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), params.rotation - Math.PI / 2);
		
		// use rotation of ground?
		
		// letters
		
		let _w = 0;
		for (let _y = h - 1; _y > 0; _y -= 2) {
			// let ray = new THREE.Raycaster(new THREE.Vector3(x, _y, z), new THREE.Vector3(0, 1, 0));
			// let collisions = ray.intersectObject(groundMesh);
			// console.log(collisions);

			for (let _x = -sideLength / 2; _x < sideLength / 2 - _w / 2; _x += _w) {
				// const letter = choice(...alphabet.split(''));
				const letter = beckett[count];
				count++;
				if (count >= beckett.length) count = 0;
				if (alphabet.includes(letter.toLowerCase())) {

					const mesh = models.letters[letter.toLowerCase()].clone();
					mesh.traverse(child => {
						if (child.constructor.name == 'Mesh') {
							child.castShadow = true;
							child.receiveShadow = true;
							child.material = getToonMaterial({
								color: 0x6f6c82,
							});
						}
					});
					const box = mesh.children[0].geometry.boundingBox;
					_w = Math.abs(box.max.x - box.min.x);
					const _h = Math.abs(box.max.y - box.min.y);
					const _d = Math.abs(box.max.z - box.min.z);
					mesh.position.x = _x + _w / 2;
					mesh.position.y = _y - 2;
					this.container.add(mesh);

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
			// m.position.copy(this.body.position);
			this.bodyMesh.quaternion.copy(this.body.quaternion);
			// this.container.add(m);
			// this.container.add(new THREE.Mesh(
			// 	new THREE.BoxGeometry( sideLength, h, 2 ),
			// 	new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true }),
			// ));
			this.container.add(new THREE.AxesHelper(0.5));
		}

		// this.container.position.copy(this.body.position);
		// this.container.quaternion.copy(this.body.quaternion);
	}
}