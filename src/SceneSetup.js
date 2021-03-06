/*
	set up for lighting and anything that's not physics
*/

import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky';
import getToonMaterial from './ToonMaterial';
import { choice, random, chance, map, distance } from './Cool';
import C from './Constants';

export default function setupScene(scene) {

	// scene.background = new THREE.Color().setHSL( 0.6, 0, 1 );
	scene.background = new THREE.Color( 0x000000 );
	scene.fog = new THREE.Fog( scene.background, 1, 250 );
	scene.fog.color.setHSL( 0.095, 0.4, 0.3 );

	function addLighting() {

		const sky = new Sky();
		sky.scale.setScalar( 450000 );
		scene.add( sky );

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
	}

	addLighting();
	
	return scene;
}