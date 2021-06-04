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
	let scene;
	
	manager.onLoad = () => {
		console.timeEnd('models loaded');
		callback();
	};
	console.time('models loaded');

	Object.keys(C.models).forEach(key => {
		const { str, path, filename, instance, filenames } = C.models[key];
		if (instance) instances[key] = {};
		models[key].gltfs = {};

		if (str) {
			str.split('').forEach(letter => {
				loader.load(`${path}${filename}${letter}.glb`, gltf => {
					if (key == 'grass' && letter == 'h') console.log(gltf)
					models[key].gltfs[letter] = gltf;

					if (instance) {
						addInstanceMesh(key, letter, gltf, C.models[key]);
					}
				});
			});
		}

		if (!str && filenames) {
			filenames.forEach(filename => {
				loader.load(`${path}${filename}.glb`, gltf => {
					models[key].gltfs[filename] = gltf;
				});
			});
		}
	});

	function addInstanceMesh(key, letter, gltf, params) {
		// add shadows -- https://discourse.threejs.org/t/shadow-for-instances/7947/10

		const { str, texturePath, repeat, color, shadow } = params;

		const material = getToonMaterial({
			color: color.length ? color[0] : color,
			texture: texturePath,
			repeat: repeat,
		});

		// grass and trees -- only support for two meshes, colors
		const hasChildren = gltf.scene.children[0].children.length > 0;
		const geo = hasChildren ? 
			gltf.scene.children[0].children[0].geometry :
			gltf.scene.children[0].geometry;
		
		const mesh = new THREE.InstancedMesh(geo, material, 1024);
		mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		mesh.castShadow = shadow[0];
		mesh.receiveShadow = shadow[1];
		
		instances[key][letter] = {
			mesh: mesh,
			count: 0,
		};

		if (hasChildren) {
			const geo2 = gltf.scene.children[0].children[1].geometry;
			const mat2 = getToonMaterial({
				color: color.length ? color[1] : color,
				texture: texturePath,
				repeat: repeat,
			});
			const mesh2 = new THREE.InstancedMesh(geo2, mat2, 1024);
			mesh2.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
			mesh2.castShadow = shadow[0];
			mesh2.receiveShadow = shadow[1];
			instances[key][letter].mesh2 = mesh2;
		}
	}

	this.addInstance = function(key, letter, matrix) {
		if (letter == 'random') letter = choice(...Object.keys(instances[key]));
		if (instances[key][letter].count == 0) {
			scene.add(instances[key][letter].mesh);
			if (instances[key][letter].mesh2) scene.add(instances[key][letter].mesh2)
		}
		instances[key][letter].mesh.setMatrixAt(instances[key][letter].count++, matrix);
		if (instances[key][letter].mesh2) {
			instances[key][letter].mesh2.setMatrixAt(instances[key][letter].count, matrix);
		}
	};

	this.updateCount = function() {
		for (const key in instances) {
			for (const letter in instances[key]) {
				instances[key][letter].mesh.count = instances[key][letter].count;
				if (instances[key][letter].mesh2) {
					instances[key][letter].mesh2.count = instances[key][letter].count;
				}
			}
		}
	};

	this.getModel = function(type, key) {
		return models[type].gltfs[key].scene.clone();
	};

	this.getGLTF = function(type, key) {
		return cloneGltf(models[type].gltfs[key]);
	};

	this.setScene = function(_scene) {
		scene = _scene;
	};

	this.reset = function() {
		console.log('instances', instances);
		for (const k in instances) {
			if (k != 'buildings') {
				for (const m in instances[k]) {
					scene.remove(instances[k][m].mesh);
					if (instances[k][m].mesh2) scene.remove(instances[k][m].mesh2);
					instances[k][m] = {};
					addInstanceMesh(k, m, models[k].gltfs[m], C.models[k]);
				}
			}
		}

	};
}