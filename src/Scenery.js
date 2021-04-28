/*
	scenery that needs ground etc
*/

import * as THREE from 'three';
import getToonMaterial from './ToonMaterial';
import { choice, random, chance, map, distance } from './Cool';

export default function addScenery(scene, modelLoader, ground) {

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
		for (let x = -b; x < b; x += 8) {
			for (let z = -b; z < b; z += 8) {
				let d = distance(0, 0, x, z);
				let pct = map(d, 0, long, 0, 0.4);
				if (chance(pct)) {
					const y = ground.getClosestVert(x, z);
					dummy.position.set(x, y, z);
					dummy.rotation.y = random(Math.PI * 2);
					dummy.updateMatrix();
					const letter = choice(...Object.keys(meshes));
					meshes[letter].top.setMatrixAt(meshes[letter].topCount++, dummy.matrix);
					meshes[letter].bottom.setMatrixAt(meshes[letter].bottomCount++, dummy.matrix);
					
				}
			}
		}

		for (const m in meshes) {
			meshes[m].top.count = meshes[m].topCount;
			meshes[m].bottom.count = meshes[m].bottomCount;

		}
	}

	addTrees();
}