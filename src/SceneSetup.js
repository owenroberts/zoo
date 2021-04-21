/*
	set up for lighting and anything that's not physics
*/

import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky';
import getToonMaterial from './ToonMaterial';
import { choice, random, chance, map, distance } from './Cool';

export default function setupScene(modelLoader) {

	const scene = new THREE.Scene();
	
	scene.background = new THREE.Color().setHSL( 0.6, 0, 1 );
	scene.background = new THREE.Color( 0x000000 );
	scene.fog = new THREE.Fog( scene.background, 1, 1000 );
	scene.fog.color.setHSL( 0.095, 0.4, 0.3 );

	const sky = new Sky();
	sky.scale.setScalar( 450000 );
	scene.add( sky );


// lighting
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
	scene.add(ambientLight);

	const sun = new THREE.Vector3();

	const uniforms = sky.material.uniforms;
	uniforms[ "turbidity" ].value = 10;
	uniforms[ "rayleigh" ].value = 2;
	uniforms[ "mieCoefficient" ].value = 0.02;
	uniforms[ "mieDirectionalG" ].value = 0.7;

	const theta = Math.PI * ( 0.48 - 0.5 ); // inclination
	const phi = 2 * Math.PI * ( 0.25 - 0.5 ); // azimuth

	sun.x = Math.cos( phi );
	sun.y = Math.sin( phi ) * Math.sin( theta );
	sun.z = Math.sin( phi ) * Math.cos( theta );

	uniforms[ "sunPosition" ].value.copy( sun );

	// const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
	const hemiLight = new THREE.HemisphereLight( 0x9e9e9e, 0xd9d9d9, 0.6 );
	hemiLight.color.setHSL( 0.6, 1, 0.6 );
	hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
	hemiLight.position.set( 0, 50, 0 );
	scene.add( hemiLight );

	const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
	dirLight.color.setHSL( 0.1, 1, 0.95 );
	dirLight.position.set( 0.25, 1.75, -2 );
	dirLight.position.multiplyScalar( 30 );
	scene.add( dirLight );

	dirLight.castShadow = true;

	dirLight.shadow.mapSize.width = 2048;
	dirLight.shadow.mapSize.height = 2048;

	const d = 50;

	dirLight.shadow.camera.left = - d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = - d;

	dirLight.shadow.camera.far = 3500;
	dirLight.shadow.bias = - 0.0001;
	
// buildings
	// add shadows -- https://discourse.threejs.org/t/shadow-for-instances/7947/10
	const buildingMaterial = getToonMaterial({
		color: 0xb6d1fc,
		// emissiveColor: 0x1e00ff,
	});
	const dummy = new THREE.Object3D();
	const buildingMeshes = {};

	'abcdefg'.split('').forEach(letter => {
		const building = modelLoader.getGLTF('buildings', letter);
		const geo = building.scene.children[0].geometry;
		const mesh = new THREE.InstancedMesh(geo, buildingMaterial, 36);
		mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
		mesh.castShadow = true;
		buildingMeshes[letter] = {
			mesh: mesh,
			count: 0,
		};
		scene.add(buildingMeshes[letter].mesh);
	});

	// ground 256 x 256
	for (let i = 0; i < 2; i++) {
		let z = -120 + -32 * i;
		// let z = -120;
		for (let j = 0; j < 4; j++) {
			const r = [Math.PI, 0, -Math.PI/2, Math.PI/2][j];
			z *= j % 1 == 0 ? -1 : 1;
			for (let x = 24; x < (256 - 24); x += 12) {
				let _x = j > 1 ? z + 128 : x;
				let _z = j > 1 ? x - 128: z;
				dummy.position.set(_x - 128, 3, _z);
				dummy.rotation.y = r;
				dummy.updateMatrix();
				const letter = choice(...Object.keys(buildingMeshes));
				buildingMeshes[letter].mesh.setMatrixAt(buildingMeshes[letter].count++, dummy.matrix);
			}
		}
	}

	for (const m in buildingMeshes) {
		// console.log('buildings', m, buildingMeshes[m].count);
		buildingMeshes[m].mesh.count = buildingMeshes[m].count;
	}

// trees
	const texture = new THREE.TextureLoader().load( './static/textures/tree.png' );
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 8, 8 );
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
	// const treeMaterial = new THREE.MeshFaceMaterial([leavesMaterial, trunkMaterial]);


	// const treeMeshes = [];
	// 'abcdef'.split('').forEach(letter => {
		// const tree = modelLoader.getGLTF('trees', letter);
		// const geo = tree.scene.children[0].geometry;
		// const mesh = new THREE.InstancedMesh(geo, treeMaterial, 64);
		// mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
		// mesh.castShadow = true;
		// treeMeshes[letter] = {
		// 	mesh: mesh,
		// 	// count: 0,
		// };

		// scene.add(treeMeshes[letter].mesh);
	// });

	let b = 112; // bound
	let long = distance(0, 0, b, b);
	for (let x = -b; x < b; x += 8) {
		for (let z = -b; z < b; z += 8) {
			let d = distance(0, 0, x, z);
			let pct = map(d, 0, long, 0, 0.5);
			if (chance(pct)) {
				const letter = choice(...'abcdef'.split(''));
				const mesh = modelLoader.getModel('trees', letter);
				mesh.children[0].children[0].material = treeMaterial;
				mesh.children[0].children[1].material = trunkMaterial;
				// mesh.children[0].material = treeMaterial;
				mesh.castSahdow = true;
				mesh.position.set(x, 3, z);
				mesh.rotation.y = random(Math.PI * 2);
				// dummy.updateMatrix();
				scene.add(mesh);
				
				// treeMeshes[letter].mesh.setMatrixAt(treeMeshes[letter].count++, dummy.matrix);
			}
		}
	}

	// for (const m in treeMeshes) {
	// 	// console.log('trees', m, treeMeshes[m].count);
	// 	treeMeshes[m].mesh.count = treeMeshes[m].count;
	// }


	return scene;
}