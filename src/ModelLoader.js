/*
	load models here and provide access to other modules
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import cloneGltf from './lib/three-clone-gltf.js';

export default function ModelLoader(callback) {
	
	const models = {
		letters: {
			path: './static/models/letters-2-low/',
			str: 'abcdefghijklmnopqrstuvwxyz',
			filename: '',
		},
		characters: {
			path: './static/models/characters/',
			str: 'ab',
			filename: 'zo',
		},
		buildings: {
			path: './static/models/buildings/',
			str: 'abcdefg',
			filename: 'building-',
		},
		trees: {
			path: './static/models/trees-2/',
			str: 'abcdef',
			filename: 'tree-',
		},
		grass: {
			path: './static/models/grass/',
			str: 'abcdefg',
			filename: 'grass-',
		},
	};

	const manager = new THREE.LoadingManager();
	const loader = new GLTFLoader(manager);
	
	manager.onLoad = () => {
		console.timeEnd('models loaded');
		callback();
	};
	console.time('models loaded');

	Object.keys(models).forEach(key => {
		const { str, path, filename } = models[key];
		models[key].gltfs = {}; 

		str.split('').forEach(letter => {
			loader.load(`${path}${filename}${letter}.glb`, gltf => {
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