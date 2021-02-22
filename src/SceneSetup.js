/*
	set up for lighting and anything that's not physics
*/

import * as THREE from 'three';


function setupScene() {

	const scene = new THREE.Scene();
	
	scene.fog = new THREE.Fog(0x000000, 0, 500);

	const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(ambientLight);

	const spotlight = new THREE.SpotLight(0xffffff, 0.5, 0, Math.PI / 4, 1)
	spotlight.position.set(10, 30, 20);
	spotlight.target.position.set(0, 0, 0);
	spotlight.castShadow = true;
	spotlight.shadow.camera.near = 10;
	spotlight.shadow.camera.far = 100;
	spotlight.shadow.camera.fov = 30;
	spotlight.shadow.mapSize.width = 2048;
	spotlight.shadow.mapSize.height = 2048;
	scene.add(spotlight);

	const spotlight2 = new THREE.SpotLight(0xff33ff, 0.5, 0, Math.PI / 4, 1)
	spotlight2.position.set(-10, 30, -20);
	spotlight2.target.position.set(0, 0, 0);
	spotlight2.castShadow = true;
	spotlight2.shadow.camera.near = 10;
	spotlight2.shadow.camera.far = 100;
	spotlight2.shadow.camera.fov = 30;
	spotlight2.shadow.mapSize.width = 2048;
	spotlight2.shadow.mapSize.height = 2048;
	scene.add(spotlight2);

	const spotlight3 = new THREE.SpotLight(0x11eeff, 0.5, 0, Math.PI / 4, 1)
	spotlight2.position.set(-10, 30, 20);
	spotlight2.target.position.set(0, 0, 0);
	spotlight2.castShadow = true;
	spotlight2.shadow.camera.near = 10;
	spotlight2.shadow.camera.far = 100;
	spotlight2.shadow.camera.fov = 30;
	spotlight2.shadow.mapSize.width = 2048;
	spotlight2.shadow.mapSize.height = 2048;
	scene.add(spotlight2);

	const material = new THREE.MeshLambertMaterial({ color: 0xdddddd });
	const floorGeometry = new THREE.PlaneBufferGeometry(300, 300, 100, 100);
	floorGeometry.rotateX(-Math.PI / 2);
	const floor = new THREE.Mesh(floorGeometry, material);
	// floor.position.y = -1;
	floor.receiveShadow = true;
	scene.add(floor);

	return scene;
}

export { setupScene };