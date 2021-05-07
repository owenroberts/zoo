/*
	load models here and provide access to other modules
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import cloneGltf from './lib/three-clone-gltf.js';
import getToonMaterial from './ToonMaterial';
import { choice } from './Cool';
import C from './Constants';

export default function ModelLoader(callback) {
	
	const models = C.models;
	const manager = new THREE.LoadingManager();
	const loader = new GLTFLoader(manager);
	const instances = {};
	
	
	manager.onLoad = () => {
		console.timeEnd('models loaded');
		callback();
	};
	console.time('models loaded');

	Object.keys(C.models).forEach(key => {
		const { str, path, filename, instance } = C.models[key];
		if (instance) instances[key] = {};
		models[key].gltfs = {}; 

		str.split('').forEach(letter => {
			loader.load(`${path}${filename}${letter}.glb`, gltf => {
				if (key == 'grass' && letter == 'h') console.log(gltf)
				models[key].gltfs[letter] = gltf;

				if (instance) {
					addInstanceMesh(key, letter, gltf, C.models[key]);
				}
			});
		});
	});

	function addInstanceMesh(key, letter, gltf, params) {
		// add shadows -- https://discourse.threejs.org/t/shadow-for-instances/7947/10
		const { str, texturePath, repeat, color, shadow } = params;

		const texture = new THREE.TextureLoader().load(texturePath);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(repeat, repeat);

		const material = getToonMaterial({
			map: texture,
			color: color,
		});

		const geo = gltf.scene.children[0].geometry;
		const mesh = new THREE.InstancedMesh(geo, material, 512);
		mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		mesh.castShadow = shadow[0];
		mesh.receiveShadow = shadow[1];
		instances[key][letter] = {
			mesh: mesh,
			count: 0,
		};
	}

	this.addInstance = function(scene, key, letter, matrix) {
		if (letter == 'random') letter = choice(...Object.keys(instances[key]));
		if (instances[key][letter].count == 0) scene.add(instances[key][letter].mesh);
		instances[key][letter].mesh.setMatrixAt(instances[key][letter].count++, matrix);
	};

	this.updateCount = function(key) {
		for (const m in instances[key]) {
			instances[key][m].mesh.count = instances[key][m].count;
		}
	};

	this.getModel = function(type, key) {
		return models[type].gltfs[key].scene.clone();
	};

	this.getGLTF = function(type, key) {
		return cloneGltf(models[type].gltfs[key]);
	};

}