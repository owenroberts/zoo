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

		this.body = new CANNON.Body({ mass: 0, material: new CANNON.Material() })
		this.body.position.set(x, y + h * postHeight / 2, z);
		this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), params.rotation - Math.PI / 2);
		const shape = new CANNON.Box(new CANNON.Vec3(C.sideLength / 2, h * postHeight / 2, isRock ? 1 : 0.5));
		this.body.addShape(shape);
		

		const dummy = new THREE.Object3D();

		function addFence() {
			for (let j = 0; j < h; j++) {

				dummy.position.set(x, y, z);
				dummy.quaternion.copy(self.container.quaternion);
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
		}

		function addRock() {

			for (let j = 0; j < h; j++) {
				dummy.position.set(x, y, z);
				dummy.quaternion.copy(self.container.quaternion);
				dummy.translateY(j * postHeight);
				dummy.updateMatrix();
				modelLoader.addInstance('rocks', 'random', dummy.matrix);
			}
		}

		function addLabel(_y, letter) {
			const str = `zoo${letter}s`;
			const ny = _y > 0 ? _y : ground.getHeight(x, z).point.y;
			dummy.position.set(x, ny, z);
			dummy.quaternion.copy(self.container.quaternion);
			dummy.translateX(-4);
			for (let i = 0; i < str.length; i++) {
				dummy.updateMatrix();
				modelLoader.addInstance('letters', str[i], dummy.matrix);
				dummy.translateX(2);
			}
		}

		function addArrow(direction, _y) {
			const arrow = modelLoader.getModel('items', `arrow-${direction}`);
			// arrow.position.set(x, y, z);
			arrow.translateY(_y);
			const texture = new THREE.TextureLoader().load(C.letterTexturePath);
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(8, 8);
			const material = getToonMaterial({
				color: 0x6f6c82,
				map: texture,
			});
			arrow.traverse(child => {
				if (child.constructor.name == 'Mesh') {
					child.material = material;
					child.receiveShadow = true;
				}
			});
			self.container.add(arrow);
		}

		if (arrow) {
			addArrow(arrow, arrow == 'left' ? 12 : 14);
			addLabel(arrow == 'left' ? 17 : 15, arrow == 'left' ? 'b' : 'c');
		}

		if (labelWall) addLabel(0, 'a');
		else if (isRock || arrow) addRock();
		else addFence();


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