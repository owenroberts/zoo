import * as THREE from 'three';
import ModelLoader from './ModelLoader';
import Physics from './PhysicsEngine';
import { CharacterController } from './CharacterController';
import { CharacterControllerInput } from './CharacterControllerInput';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { OrbitControls } from './OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import { HalftonePass } from 'three/examples/jsm/postprocessing/HalftonePass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import { choice, random, chance } from './Cool';
import Ground from './Ground';
import setupScene from './SceneSetup';
import addScenery from './Scenery';
import HexMap from './HexMap';
import DialogDisplay from './DialogDisplay';
import AI from './AI';
import VoiceSynth from './AIVoiceSynth';
import Doodoo from '../doodoo/doodoo.js';

import C from './Constants';

// three.js variables
let camera, scene, renderer, stats, dpr;
let composer, effects, effectSobel, outlinePass;
let w = window.innerWidth, h = window.innerHeight;
let controls;
// const cameraOffset = new THREE.Vector3(-120, 60, -120); // distant view for testing
const cameraOffset = new THREE.Vector3(-6, 6, -8);
let thirdPersonCamera;
let physics;
let playerInput, playerController;

let ais;
let dialogDisplay = new DialogDisplay(w, h);
let voiceSynth = new VoiceSynth();
let onBoardingCount = 0, doOnBoarding = false;
let doneOnboarding = !doOnBoarding;


const modelLoader = new ModelLoader(() => {
	init();
	animate();
});


function initSound() {
	const tonic = 'C#5';
	const part1 = [
		['C#6', '2n'], ['D#6', '2n'], [null, '2n'], [null, '8n'], ['A#5', '8n'], ['G#5', '8n'], [null, '8n'],
		['C#6', '2n'], ['D#6', '2n'], ['E6', '2n'], [null, '4n'], ['B5', '8n'], ['A5', '8n'],
		['E6', '2n'], ['F#6', '2n'], ['G#6', '2n'], [null, '4n'], ['C#7', '8n'], ['D#7', '8n'], 
		['C#7', '8n'], [null, '8n'], ['A#6', '4n'], ['G#6', '4n'], ['A#6', '8n'], ['G#6', '4n'], ['A#6', '8n'], ['G#6', '8n'], ['A#6', '8n'], ['G#6', '4n'], [null, '8n']
	];
	const doodoo = new Doodoo(tonic, [part1], '8n');
	doodoo.setBPM(112);
}

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
	modelLoader.setScene(scene);
	renderer.setClearColor(scene.fog.color);
// stats
	stats = new Stats();
	document.body.appendChild(stats.dom);
	window.addEventListener('resize', onWindowResize);

// setup

	const hexMap = new HexMap(C.hexRings, true);
	
	const ground = new Ground();
	scene.add(ground.mesh);
	
	physics = new Physics(scene, ground, hexMap, modelLoader);
	
	playerInput = new CharacterControllerInput();
	playerController = new CharacterController(scene, physics, modelLoader, playerInput, [3, 8, 3]);
	// thirdPersonCamera = new ThirdPersonCamera(camera, playerControls);
	camera.lookAt(cameraOffset.clone());
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	controls.goTo(playerController.getPosition()); 
	// controls.maxDistance = 50;
	// controls.enableZoom = false;

	ais = new AI(hexMap, scene, physics, modelLoader);

	addScenery(scene, modelLoader, ground, hexMap);

	// update all models counts
	modelLoader.updateCount();

// effects
	composer = new EffectComposer( renderer );
	const renderPass = new RenderPass( scene, camera );
	composer.addPass( renderPass );

	const effectGrayScale = new ShaderPass( LuminosityShader );

	effectSobel = new ShaderPass( SobelOperatorShader );
	effectSobel.uniforms[ 'resolution' ].value.x = w * window.devicePixelRatio;
	effectSobel.uniforms[ 'resolution' ].value.y = h * window.devicePixelRatio;

	const halftonePass = new HalftonePass(w, h, {
		shape: 1,
		radius: 4,
		rotateR: Math.PI / 12,
		rotateB: Math.PI / 12 * 2,
		rotateG: Math.PI / 12 * 3,
		scatter: 0,
		blending: 0.75,
		blendingMode: 3,
		greyscale: false,
		disable: false
	});
	
	const effectVignette = new ShaderPass( VignetteShader );
	effectVignette.uniforms[ "offset" ].value = 1;
	effectVignette.uniforms[ "darkness" ].value = 1.3;

	const effectFilm = new FilmPass( 0.35, 0, 0, false );
	const gammaCorrection = new ShaderPass( GammaCorrectionShader );

	const effectFXAA = new ShaderPass( FXAAShader );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / w, 1 / h );
				

	
	// composer.addPass( effectSobel );
	// composer.addPass( effectGrayScale );
	// composer.addPass( halftonePass );
	// composer.addPass( effectFilm );
	// composer.addPass( effectVignette );
	// composer.addPass( gammaCorrection );
	// composer.addPass( effectFXAA );
}

let previousRAF = null;
function animate() {
	requestAnimationFrame(t => {
		if (previousRAF === null) previousRAF = t;
		animate();
		composer.render();
		// renderer.render(scene, camera);
		
		const timeElapsed = t - previousRAF;
		
		if (playerController) playerController.update(timeElapsed);
		if (playerController.isTalking && doneOnboarding) {
			if (dialogDisplay.getStatus() == 'ended') {
				playerController.isTalking = false; 
				dialogDisplay.setMessage('');
			}
		}

		if (dialogDisplay && doOnBoarding) {
			if (onBoardingCount < C.onBoarding.length) {
				if (dialogDisplay.getStatus() == 'ended') {
					dialogDisplay.setMessage(C.onBoarding[onBoardingCount]);
					dialogDisplay.setDoesEnd(false);
				}
			}
		}
		
		if (ais) {
			const aiProps = ais.update(timeElapsed, playerController.getProps());
			// playerInput.sniff = playerController.sniffCheck(aiProps);
		}

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
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
	renderer.setSize(dpr * w, dpr * (w * h / w));
	effectSobel.uniforms[ 'resolution' ].value.x = w * window.devicePixelRatio;
	effectSobel.uniforms[ 'resolution' ].value.y = h * window.devicePixelRatio;
}

// message events
window.addEventListener("message", (event) => {
	if (event.data.aiMessage) {
		dialogDisplay.setMessage(event.data.aiMessage);
		voiceSynth.speak(event.data.aiMessage);
		playerController.isTalking = true;
		console.log('isTalking?', playerController);
	}

	if (event.data.testAxes) {
		let { position, quaternion, length } = event.data.testAxes;
		if (!quaternion) quaternion = new THREE.Quaternion().toArray();
		
		const axes = new THREE.AxesHelper(length || 3);
		axes.position.copy(position);
		axes.quaternion.copy(new THREE.Quaternion().fromArray(quaternion));
		scene.add(axes);
	}
}, false);

// key commands
document.addEventListener('keydown', ev => {
	if (ev.key == 'r') {
		// reset camera zoom
		controls.reset(); // adjust to also reset position ... 
		// console.log(controls);
	}

	if (ev.key == 'x' && doOnBoarding &&
		onBoardingCount <= C.onBoarding.length && 
		dialogDisplay.getStatus() == 'message') {
		if (onBoardingCount == 0) initSound();
		// start with sound
		onBoardingCount++;
		dialogDisplay.setDoesEnd(true);
		// if (onBoardingCount == 2) playerInput.setReady();
		if (onBoardingCount == C.onBoarding.length) {
			dialogDisplay.setMessage('');
			playerController.isTalking = false;
			doneOnboarding = true;
		}
	}

	if (ev.key == 'z' && onBoardingCount == 0 && doOnBoarding) {
		// start without sound
		onBoardingCount++;
		dialogDisplay.setDoesEnd(true);
	}
});