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
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js';
import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js';

import { choice, random, chance } from './Cool';
import Ground from './Ground';
import setupScene from './SceneSetup';
import Scenery from './Scenery';
import HexMap from './HexMap';
import DialogDisplay from './DialogDisplay';
import AI from './AI';
import VoiceSynth from './AIVoiceSynth';
import Doodoo from '../doodoo/doodoo.js';

import C from './Constants';

let camera, scene, renderer, stats, dpr;
let composer, renderComposer, effectComposer, effectSobel;
let controls;
let w = window.innerWidth, h = window.innerHeight;

// const cameraOffset = new THREE.Vector3(-120, 60, -120); // distant view for testing
const cameraOffset = new THREE.Vector3(-6, 6, -8);
let thirdPersonCamera;
let physics, ground, groundObjects = [], scenery, portals = [];
let playerInput, playerController;

let ais;
let dialogDisplay = new DialogDisplay(w, h);
let voiceSynth = new VoiceSynth();
let onBoardingCount = 0, doOnBoarding = false;
let doneOnboarding = !doOnBoarding;

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

const modelLoader = new ModelLoader(() => {
	init();
	animate();
});

function init() {
// renderer -- scene -- setup
	const [fov, aspect, near, far] = [60, w / h, 1.0, 2000.0];
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.copy(cameraOffset.clone());

	dpr = window.devicePixelRatio;
	renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setSize(dpr * w, dpr * (w * h / w));
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.domElement.style.zoom = 1 / dpr;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMappingExposure = 0.5;
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);

	scene = new THREE.Scene();
	setupScene(scene);
	modelLoader.setScene(scene);
	renderer.setClearColor(scene.fog.color);

// stats
	stats = new Stats();
	document.body.appendChild(stats.dom);
	window.addEventListener('resize', onWindowResize);

// setup
	
	ground = new Ground();
	scene.add(ground.mesh);
	groundObjects.push(ground.mesh);
	
	physics = new Physics(scene, ground);
	scenery = new Scenery(scene, ground, modelLoader);
	scenery.setup();

	playerInput = new CharacterControllerInput();
	playerController = new CharacterController(scene, physics, modelLoader, playerInput, [3, 8, 3]);

	// thirdPersonCamera = new ThirdPersonCamera(camera, playerControls);
	camera.lookAt(cameraOffset.clone());

	controls = new OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	// controls.goTo(playerController.getPosition()); 
	// controls.maxDistance = 50;
	// controls.enableZoom = false;


	buildLevel();
	

// post processing

	const target1 = new THREE.WebGLRenderTarget( w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat} );
	const	target2 = new THREE.WebGLRenderTarget( w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat } );

	const renderPass = new RenderPass( scene, camera );
	effectComposer = new EffectComposer( renderer, target1 );
	effectComposer.renderToScreen = false;
	effectComposer.addPass(renderPass);

	effectSobel = new ShaderPass( SobelOperatorShader );
	effectSobel.uniforms[ 'resolution' ].value.x = w * window.devicePixelRatio;
	effectSobel.uniforms[ 'resolution' ].value.y = h * window.devicePixelRatio;
	effectComposer.addPass(effectSobel);

	const gammaCorrection = new ShaderPass( GammaCorrectionShader );
	effectComposer.addPass(gammaCorrection);

	// const effectGrayScale = new ShaderPass( LuminosityShader );

	// const effectColorCorrect = new ShaderPass(ColorCorrectionShader);
	// effectColorCorrect.uniforms['powRGB'].value.set(0.25, 0.5, 0.25);

	renderComposer = new EffectComposer(renderer, target2);
	renderComposer.renderToScreen = false;
	renderComposer.addPass(renderPass);

	const blender = new ShaderPass(BlendShader);
	blender.uniforms.tDiffuse1.value = renderComposer.readBuffer.texture;
	blender.uniforms.tDiffuse2.value = effectComposer.readBuffer.texture;
	blender.uniforms['mixRatio'].value = 0.5;

	composer = new EffectComposer(renderer);
	composer.renderToScreen = true;
	composer.addPass(blender);


	// const effectVignette = new ShaderPass( VignetteShader );
	// effectVignette.uniforms[ "offset" ].value = 0.5;
	// effectVignette.uniforms[ "darkness" ].value = 0.75;
	// composer.addPass(effectVignette);
	// const effectFilm = new FilmPass( 0.35, 0.3, 3, false );
	// composer.addPass(effectFilm);
}


function buildLevel() {
	const hexMap = new HexMap(C.hexRings, true);
	const hexes = hexMap.getHexes();

	hexMap.observationDeskStartHex = choice(...hexMap.getRing(3));
	const arrowHex = choice(...hexMap.getHexesByDistance(hexMap.observationDeskStartHex, 6));
	arrowHex.isArrowHex = true;
	hexMap.getRing(0)[0].isCenter = true;

	hexes.forEach(hex => {
		let walls = hexMap.getWalls(hex, C.sideLength);
		if (hex.isCenter) choice(...walls).isLabelWall = true;
		if (hex.isArrowHex) {
			walls[0].arrowDirection = 'left';
			walls[1].arrowDirection = 'right';
			portals.push({
				position: scenery.addPortal(walls[0]),
				level: 'b',
				entered: false,
			});
			portals.push({
				position: scenery.addPortal(walls[1]),
				level: 'c',
				entered: false,
			});
		}
		for (let i = 0; i < walls.length; i++) {
			const { x, z, rotation, key, distance, arrow, isLabelWall, arrowDirection } = walls[i];
			const y = 4, h = distance + 1, postHeight = 2.8;
			const isRock = distance == 3 || chance(0.4);
			physics.addWall(x, y, z, h, postHeight, rotation, isRock);
			scenery.addWall(x, y, z, h, postHeight, rotation, isRock, isLabelWall, arrowDirection);
		}
	});

	scenery.addObservationDeck(hexMap);

	ais = new AI(hexMap, scene, physics, modelLoader);
	scenery.addTrees();
	modelLoader.updateCount();
}

function reset() {
	physics.reset();
	modelLoader.reset();
	scenery.reset();
	ais.reset();
}


let previousRAF = null;
function animate() {
	requestAnimationFrame(t => {
		if (previousRAF === null) previousRAF = t;
		animate();

		effectComposer.render();
		renderComposer.render();
		composer.render();
		// renderer.render(scene, camera);

		const timeElapsed = t - previousRAF;
		if (playerController) playerController.update(timeElapsed, groundObjects);
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


		for (let i = 0; i < portals.length; i++) {
			const d = playerController.getPosition().distanceTo(portals[i].position);
			if (d < 3 && !portals[i].entered) {
				dialogDisplay.setMessage('press x to enter');
				playerController.isTalking = true;
				portals[i].entered = true;
				dialogDisplay.setDoesEnd(false);
			} else if (d > 3 && portals[i].entered) {
				portals[i].entered = false;
				dialogDisplay.setDoesEnd(true);
			}
		}

		physics.update(timeElapsed);
		controls.update();
		controls.goTo(playerController.getPosition()); 
		stats.update();
		previousRAF = t;
	});
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

	if (ev.key == 'x') {
		if (doOnBoarding && onBoardingCount <= C.onBoarding.length && 
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

		let enterPortal = portals.filter(portal => portal.entered)[0];
		if (enterPortal) {
			reset();
			buildLevel();
		}
	}

	if (ev.key == 'z' && onBoardingCount == 0 && doOnBoarding) {
		// start without sound
		onBoardingCount++;
		dialogDisplay.setDoesEnd(true);
	}
});

function onWindowResize() {
	w = window.innerWidth;
	h = window.innerHeight;
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
	renderer.setSize(dpr * w, dpr * (w * h / w));
	effectSobel.uniforms[ 'resolution' ].value.x = w * window.devicePixelRatio;
	effectSobel.uniforms[ 'resolution' ].value.y = h * window.devicePixelRatio;
}