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
const cameraOffset = new THREE.Vector3(-60, 60, -80);
let thirdPersonCamera;
let physics;
let playerInput, playerController;
let AIs = [], numAIs = 20;


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

	scene = setupScene();
	renderer.setClearColor(scene.fog.color);

	stats = new Stats();
	document.body.appendChild(stats.dom);
	window.addEventListener('resize', onWindowResize);

	physics = new Physics(scene, modelLoader);
	playerInput = new CharacterControllerInput();
	// playerController = new CharacterController(scene, physics, modelLoader, playerInput);
	// thirdPersonCamera = new ThirdPersonCamera(camera, playerControls);
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	controls.maxDistance = 50;
	// controls.enableZoom = false;

	for (let i = 0; i < numAIs; i++) {
		const input = new CharacterAIInput();
		const position = [random(-numAIs, numAIs), 8, random(-numAIs, numAIs)];
		const controller = new CharacterController(scene, physics, modelLoader, input, position);
		AIs.push(new CharacterAI(input, controller));
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
		
		for (let i = 0; i < AIs.length; i++) {
			AIs[i].update(timeElapsed, AIs);
		}
		
		physics.update(timeElapsed);
		controls.update();
		// controls.goTo(playerController.getPosition()); 

		stats.update();
		previousRAF = t;
	});
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(dpr * w, dpr * (w * h / w))
}
