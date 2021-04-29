/*
	scenery that needs ground etc
*/

import * as THREE from 'three';
import getToonMaterial from './ToonMaterial';
import { choice, random, chance, map, distance } from './Cool';

export default function addScenery(scene, modelLoader, ground) {

	let grassLoaded = false;
	let grassMeshes = {};

	function loadGrass() {

		const texture = new THREE.TextureLoader().load( './static/textures/grass.png' );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 16, 16 );

		const grassMaterial = getToonMaterial({
			color: 0x6db390,
			map: texture,
		});

		const flowerMaterial = getToonMaterial({
			color: 0xbfa8e0,
			map: texture,
		});

		const dummy = new THREE.Object3D();

		'abcdef'.split('').forEach(letter => {
			const model = modelLoader.getGLTF('grass', letter);
			const grass = model.scene.children[0].geometry;
			const grassMesh = new THREE.InstancedMesh(grass, grassMaterial, 512);
			grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
			grassMesh.castShadow = true;
			grassMeshes[letter] = {
				grass: grassMesh,
				grassCount: 0,
			};
			scene.add(grassMeshes[letter].grass);
		});

		'gh'.split('').forEach(letter => {
			const model = modelLoader.getGLTF('grass', letter);
			const grass = model.scene.children[0].children[0].geometry;
			const flower = model.scene.children[0].children[1].geometry;

			const grassMesh = new THREE.InstancedMesh(grass, grassMaterial, 512);
			const flowerMesh = new THREE.InstancedMesh(flower, flowerMaterial, 512);

			grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
			grassMesh.castShadow = true;

			flowerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
			flowerMesh.castShadow = true;

			grassMeshes[letter] = {
				grass: grassMesh,
				flower: flowerMesh,
				grassCount: 0,
				flowerCount: 0,
			};

			scene.add(grassMeshes[letter].grass);
			scene.add(grassMeshes[letter].flower);
		});
	}

	function addTrees() {
		const texture = new THREE.TextureLoader().load( './static/textures/tree.png' );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 16, 16 );

		const treeMaterial = getToonMaterial({
			color: 0x6db390,
			map: texture,
			// emissiveColor: 0x1e00ff,
		});

		const trunkMaterial = getToonMaterial({
			color: 0xe0d3da,
			map: texture,
			// emissiveColor: 0x1e00ff,
		});

		const dummy = new THREE.Object3D();
		const meshes = {};

		'abcdef'.split('').forEach(letter => {
			const model = modelLoader.getGLTF('trees', letter);
			const topGeo = model.scene.children[0].children[0].geometry;
			const botGeo = model.scene.children[0].children[1].geometry;

			const top = new THREE.InstancedMesh(topGeo, treeMaterial, 64);
			const bottom = new THREE.InstancedMesh(botGeo, trunkMaterial, 64);

			top.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
			top.castShadow = true;
			bottom.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
			bottom.castShadow = true;

			meshes[letter] = {
				top: top,
				bottom: bottom,
				topCount: 0,
				bottomCount: 0,
			};

			scene.add(meshes[letter].top);
			scene.add(meshes[letter].bottom);
		});

		let b = 112; // bound
		let long = distance(0, 0, b, b);
		let inside = distance(0, 0, b/2, b/2);
		for (let x = -b; x < b; x += 8) {
			for (let z = -b; z < b; z += 8) {
				let d = distance(0, 0, x, z);
				let pct = map(d, 0, long, 0, 0.2);
				if (chance(pct)) {
					const y = ground.getClosestVert(x, z);
					dummy.position.set(x, y, z);
					dummy.rotation.y = random(Math.PI * 2);
					dummy.updateMatrix();
					const letter = choice(...Object.keys(meshes));
					meshes[letter].top.setMatrixAt(meshes[letter].topCount++, dummy.matrix);
					meshes[letter].bottom.setMatrixAt(meshes[letter].bottomCount++, dummy.matrix);
					
					if (d < inside) addGrass(x, y, z);

				}
			}
		}

		for (const m in meshes) {
			meshes[m].top.count = meshes[m].topCount;
		}

		for (const m in grassMeshes) {
			grassMeshes[m].grass.count = grassMeshes[m].grassCount;
			if (grassMeshes[m].flower) {
				grassMeshes[m].flower.count = grassMeshes[m].flowerCount;
			}
		}
	}

	function addGrass(_x, _y, _z) {
		if (!grassLoaded) {
			loadGrass();
			grassLoaded = true;
		}

		const dummy = new THREE.Object3D();

		let b = 10; // bound
		let u = 2; // unit
		let long = distance(0, 0, b, b);
		for (let x = -b; x < b; x += u) {
			for (let z = -b; z < b; z += u) {
				let d = distance(0, 0, x, z);
				let pct = map(d, 0, long, 0.25, 0);
				if (chance(pct)) {
					const { point, face } = ground.getHeight(_x + x, _z + z);
					dummy.position.set(0, 0, 0);
					dummy.lookAt(face.normal);
					dummy.position.copy(point);
					dummy.rotation.y = random(Math.PI * 2);
					dummy.translateY(-0.25);
					dummy.updateMatrix();

					const letter = choice(...Object.keys(grassMeshes));
					grassMeshes[letter].grass.setMatrixAt(grassMeshes[letter].grassCount++, dummy.matrix);
					if (grassMeshes[letter].flower) {
						grassMeshes[letter].flower.setMatrixAt(grassMeshes[letter].flowerCount++, dummy.matrix);	
					}
					
				}
			}
		}

	}

	addTrees();
}