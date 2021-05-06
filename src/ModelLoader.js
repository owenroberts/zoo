/*
	load models here and provide access to other modules
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import cloneGltf from './lib/three-clone-gltf.js';
import C from './Constants';

export default function ModelLoader(callback) {
	
	const models = C.models;
	const manager = new THREE.LoadingManager();
	const loader = new GLTFLoader(manager);
	
	manager.onLoad = () => {
		console.timeEnd('models loaded');
		callback();
	};
	console.time('models loaded');

	Object.keys(C.models).forEach(key => {
		const { str, path, filename } = C.models[key];
		models[key].gltfs = {}; 

		str.split('').forEach(letter => {
			loader.load(`${path}${filename}${letter}.glb`, gltf => {
				if (key == 'grass' && letter == 'h') console.log(gltf)
				models[key].gltfs[letter] = gltf;
			})
		})
	});

	this.getModel = function(type, key) {
		return models[type].gltfs[key].scene.clone();
	};

	this.getGLTF = function(type, key) {
		return cloneGltf(models[type].gltfs[key]);
	};

}