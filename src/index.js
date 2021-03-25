import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CharacterController } from './CharacterController';
import { Physics } from './PhysicsEngine';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module.js';


import setupScene from './SceneSetup';

// three.js variables
let camera, scene, renderer, stats, dpr, w, h;
let controls; // testing only
let thirdPersonCamera;
let physics;
let playerControls;
let models = { letters: {} };
loadModels();

function startThisMotherFucker() {
	init();
	animate();
}

function init() {
	
	w = window.innerWidth;
	h = window.innerHeight;
	const [fov, aspect, near, far] = [60, w / h, 1.0, 2000.0];
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(5, 5, 5);

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

	physics = new Physics(scene, models);
	playerControls = new CharacterController(scene, camera, physics);
	thirdPersonCamera = new ThirdPersonCamera(camera, playerControls);

	// debug 
	controls = new OrbitControls(camera, renderer.domElement);
}

function loadModels() {
	const manager = new THREE.LoadingManager();
	manager.onLoad = () => {
		console.log('models loaded');
		startThisMotherFucker();
	};

	const loader = new GLTFLoader(manager);
	'abcdefghijklmnopqrstuvwxyz'.split('').forEach(letter => {
		loader.load(`./static/models/letters/${letter}.glb`, gltf => {
			models.letters[letter] = gltf.scene;
		});
	});
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
		physics.update(t - previousRAF, playerControls.getPosition());

		// debig
		controls.update();
	});
}

function step(timeElapsed) {
	const timeElapsedS = timeElapsed * 0.001;
	if (playerControls) playerControls.update(timeElapsed);
	// thirdPersonCamera.update(timeElapsedS);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(dpr * w, dpr * (w * h / w))
}
