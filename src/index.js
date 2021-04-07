import * as THREE from 'three';
import ModelLoader from './ModelLoader';
import Physics from './PhysicsEngine';
import { CharacterController } from './CharacterController';
import { CharacterControllerInput } from './CharacterControllerInput';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { OrbitControls } from './OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import CharacterAIInput from './CharacterAIInput';
import CharacterAI from './CharacterAI';
import { choice, random, chance } from './Cool';
import setupScene from './SceneSetup';

// three.js variables
let camera, scene, renderer, stats, dpr, w, h;
let controls;
// const cameraOffset = new THREE.Vector3(-20, 80, -20);
const cameraOffset = new THREE.Vector3(-6, 6, -8);
let thirdPersonCamera;
let physics;
let playerInput, playerController;
let AIs = [], numAIs = 10;

const modelLoader = new ModelLoader(() => {
	init();
	animate();
});

function init() {
	
	w = window.innerWidth;
	h = window.innerHeight;
	const [fov, aspect, near, far] = [60, w / h, 1.0, 2000.0];
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.copy(cameraOffset.clone());

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

	stats = new Stats();
	document.body.appendChild(stats.dom);
	window.addEventListener('resize', onWindowResize);

	physics = new Physics(scene, modelLoader);
	playerInput = new CharacterControllerInput();
	playerController = new CharacterController(scene, physics, modelLoader, playerInput);
	// thirdPersonCamera = new ThirdPersonCamera(camera, playerControls);
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	// controls.maxDistance = 50;
	// controls.enableZoom = false;

	let x = 0, z = 0;
	for (let i = 0; i < numAIs; i++) {
		const input = new CharacterAIInput(i == 0);
		// const position = [random(x, x + 4), 8, random(z, z + 4)];
		const position = [x, 8, z];
		const controller = new CharacterController(scene, physics, modelLoader, input, position);
		AIs.push(new CharacterAI(input, controller, i == 0));
		x += 5;
		if (x > 10) {
			z += 5;
			x = 0;	
		}
	}
}

let previousRAF = null;
function animate() {
	requestAnimationFrame(t => {
		if (previousRAF === null) previousRAF = t;
		animate();
		renderer.render(scene, camera);
		const timeElapsed = t - previousRAF;
		if (playerController) playerController.update(timeElapsed);
		
		// get ai data before update
		const aiProps = [];
		for (let i = 0; i < AIs.length; i++) {
			aiProps.push(AIs[i].controller.getProps());
		}
		aiProps.push(playerController.getProps());

		for (let i = 0; i < AIs.length; i++) {
			AIs[i].update(Math.min(1000 / 10, timeElapsed), aiProps);
		}
		
		physics.update(timeElapsed);
		controls.update();
		// controls.goTo(playerController.getPosition()); 

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
