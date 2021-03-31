/*
	load models here and provide access to other modules
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function ModelLoader(callback) {
	
	const modelPath = {
		letters: './static/models/letters-2/',
		characters: './static/models/characters/',
	};
	const models = { letters: {}, characters: {} };
	const manager = new THREE.LoadingManager();
	const loader = new GLTFLoader(manager);

	manager.onLoad = () => {
		console.log('models loaded');
		callback();
	};

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

	this.getModel = function(type, key) {
		return models[type][key];
	};

}