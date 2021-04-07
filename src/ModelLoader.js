/*
	load models here and provide access to other modules
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import cloneGltf from './lib/three-clone-gltf.js';

export default function ModelLoader(callback) {
	
	const modelPath = {
		letters: './static/models/letters-2-low/',
		characters: './static/models/characters/',
		buildings: './static/models/buildings/',
	};
	const models = { letters: {}, characters: {}, buildings: {} };
	const manager = new THREE.LoadingManager();
	const loader = new GLTFLoader(manager);

	manager.onLoad = () => {
		console.timeEnd('models loaded');
		callback();
	};

	console.time('models loaded');
	'abcdefghijklmnopqrstuvwxyz'.split('').forEach(letter => {
		loader.load(`${modelPath.letters}${letter}.glb`, gltf => {
			models.letters[letter] = gltf;
		});
	});

	'ab'.split('').forEach(letter => {
		loader.load(`${modelPath.characters}zo${letter}.glb`, gltf => {
			models.characters[letter] = gltf;
		});
	});

	'abc'.split('').forEach(letter => {
		loader.load(`${modelPath.buildings}building-${letter}.glb`, gltf => {
			models.buildings[letter] = gltf;
		})
	})


	this.getModel = function(type, key) {
		return models[type][key].scene.clone();
	};

	this.getGLTF = function(type, key) {
		return cloneGltf(models[type][key]);
	};

}