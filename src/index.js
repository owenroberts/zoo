import * as THREE from 'three';
import ModelLoader from './ModelLoader';
import { CharacterController } from './CharacterController';
import { Physics } from './PhysicsEngine';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { OrbitControls } from './OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module.js';


import setupScene from './SceneSetup';

// three.js variables
let camera, scene, renderer, stats, dpr, w, h;
let controls; // testing only
let thirdPersonCamera;
let physics;
let playerControls;

const cameraOffset = new THREE.Vector3(-6, 6, -8);

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
	playerControls = new CharacterController(scene, physics, modelLoader);
	// thirdPersonCamera = new ThirdPersonCamera(camera, playerControls);

	// debug 
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	// controls.enableZoom = false;
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

		controls.update();
		controls.goTo( playerControls.getPosition() ); 
		// if (playerControls) controls.object.position.copy(playerControls.getPosition().add(cameraOffset.clone()));

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
