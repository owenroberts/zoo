import * as THREE from 'three';
import ModelLoader from './ModelLoader';
import Physics from './PhysicsEngine';
import { CharacterController } from './CharacterController';
import { CharacterControllerInput } from './CharacterControllerInput';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { OrbitControls } from './OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { choice, random, chance } from './Cool';
import setupScene from './SceneSetup';
import HexMap from './HexMap';
import Dialog from './Dialog';
import AI from './AI';

// three.js variables
let camera, scene, renderer, stats, dpr;
let w = window.innerWidth, h = window.innerHeight;
let controls;
let hexMap, sideLength = 16;
// const cameraOffset = new THREE.Vector3(-120, 60, -120); // distant view for testing
const cameraOffset = new THREE.Vector3(-6, 6, -8);
let thirdPersonCamera;
let physics;
let playerInput, playerController;


const modelLoader = new ModelLoader(() => {
	init();
	animate();
});

let ais;
let dialog = new Dialog(w, h);
console.log(dialog);

function init() {
	
	const [fov, aspect, near, far] = [60, w / h, 1.0, 2000.0];
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.copy(cameraOffset.clone());

// renderer
	dpr = window.devicePixelRatio;
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(dpr * w, dpr * (w * h / w));
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.domElement.style.zoom = 1 / dpr;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMappingExposure = 0.5;
	document.body.appendChild(renderer.domElement);

	scene = setupScene(modelLoader);
	renderer.setClearColor(scene.fog.color);
// stats
	stats = new Stats();
	document.body.appendChild(stats.dom);
	window.addEventListener('resize', onWindowResize);

// setup
	hexMap = new HexMap(3, true);
	physics = new Physics(scene, hexMap, sideLength, modelLoader);
	playerInput = new CharacterControllerInput();
	playerController = new CharacterController(scene, physics, modelLoader, playerInput, [3, 8, 3]);
	// thirdPersonCamera = new ThirdPersonCamera(camera, playerControls);
	camera.lookAt(cameraOffset.clone());
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	controls.goTo(playerController.getPosition()); 
	// controls.maxDistance = 50;
	// controls.enableZoom = false;

	ais = new AI(10, hexMap, sideLength, scene, physics, modelLoader);
	
}

let previousRAF = null;
function animate() {
	requestAnimationFrame(t => {
		if (previousRAF === null) previousRAF = t;
		animate();
		renderer.render(scene, camera);
		const timeElapsed = t - previousRAF;
		if (playerController) playerController.update(timeElapsed);
		if (playerController.isTalking) {
			if (!dialog.isActive()) playerController.isTalking = false; 
		}
		ais.update(timeElapsed, playerController.getProps());

		physics.update(timeElapsed);
		controls.update();
		controls.goTo(playerController.getPosition()); 

		stats.update();
		previousRAF = t;
	});
}

function onWindowResize() {
	w = window.innerWidth;
	h = window.innerHeight;
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(dpr * w, dpr * (w * h / w))
}

// message events
window.addEventListener("message", (event) => {
	if (event.data.aiMessage) {
		dialog.setMessage(event.data.aiMessage);
		playerController.isTalking = true;
	}
}, false);

// key commands
document.addEventListener('keydown', ev => {
	if (ev.key == 'r') {
		// reset camera zoom
		controls.reset(); // adjust to also reset position ... 
		console.log(controls);
		
	}
});