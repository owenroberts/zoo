import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { CharacterController } from './CharacterController';
import { setupScene } from './SceneSetup';
import { Physics } from './PhysicsEngine';
import { ThirdPersonCamera } from './ThirdPersonCamera';

import Stats from 'three/examples/jsm/libs/stats.module.js';

// three.js variables
let camera, scene, renderer, stats;
let thirdPersonCamera;
let controls;
let cannnonPhysics;
let playerControls;

init();
animate();

function init() {
	
	const w = window.innerWidth;
	const h = window.innerHeight;
	const [fov, aspect, near, far] = [60, w / h, 1.0, 1000.0];
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(5, 5, 5);

	scene = setupScene();

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(w, w * h / w);
	renderer.setClearColor(scene.fog.color);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	document.body.appendChild(renderer.domElement);

	stats = new Stats();
	document.body.appendChild(stats.dom);
	window.addEventListener('resize', onWindowResize);

	cannnonPhysics = new Physics(scene);
	playerControls = new CharacterController(scene, camera, cannnonPhysics);
	thirdPersonCamera = new ThirdPersonCamera(camera, playerControls);
}

let previousRAF = null;
function animate() {
	requestAnimationFrame(t => {
		if (previousRAF === null) previousRAF = t;
		animate();
		renderer.render(scene, camera);
		step(t - previousRAF);
		previousRAF = t;
		stats.update();
	});
}

function step(timeElapsed) {
	const timeElapsedS = timeElapsed * 0.001;
	if (playerControls) {
		playerControls.update(timeElapsedS);
		if (cannnonPhysics && playerControls.isReady()) {
			const position = playerControls.getPosition();
			cannnonPhysics.update(position);
		}
	}
	thirdPersonCamera.update(timeElapsedS);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}
