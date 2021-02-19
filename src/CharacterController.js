import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { CharacterFSM, IdleState, DanceState, WalkState, RunState } from './CharacterStates';
import { CharacterControllerInput } from './CharacterControllerInput';


function CharacterController(scene, camera, physicsEngine) {
	
	let character, mixer, stateMachine;
	const animations = {};
	const input = new CharacterControllerInput();

	const modelContainer = new THREE.Group(); // used to ground character
	// modelContainer.position.y = -0.5;
	scene.add(modelContainer);

	let isLoaded = false;
	this.isReady = function() {
		return isLoaded;
	};

	loadModels();

	function startStateMachine() {
		stateMachine = new CharacterFSM(animations);
		stateMachine.set('idle');
		isLoaded = true;
	}

	function loadModels() {
		const loader = new FBXLoader();
		loader.setPath('./static/test_models/');
		loader.load('mremireh_o_desbiens.fbx', fbx => {
			fbx.scale.setScalar(0.01);
			fbx.traverse(c => { c.castShadow = true; });
			
			character = fbx;
			// scene.add(character);
			modelContainer.add(character);
			console.log(character);
			mixer = new THREE.AnimationMixer(character);

			const manager = new THREE.LoadingManager();
			manager.onLoad = () => {
				startStateMachine();
			}

			function onLoad(name, anim) {
				const clip = anim.animations[0];
				const action = mixer.clipAction(clip);

				animations[name] = {
					clip: clip,
					action: action,
				};
			}

			const animLoader = new FBXLoader(manager);
			animLoader.setPath('./static/test_models/');
			animLoader.load('walk.fbx', a => { onLoad('walk', a); });
			animLoader.load('dance.fbx', a => { onLoad('dance', a); });
			animLoader.load('run.fbx', a => { onLoad('run', a); });
			animLoader.load('walk-backwards.fbx', a => { onLoad('back', a); });
			animLoader.load('idle.fbx', a => { onLoad('idle', a); });
		});
	}

	// get pos and rot for camera
	this.getPosition = function() {
		if (!character) return new THREE.Vector3();
		return character.position;
	};

	this.getRotation = function() {
		if (!character) return new THREE.Quaternion();
		return character.quaternion;
	};

	// physics
	const radius = 1.3;
	const sphereShape = new CANNON.Sphere(radius);
	const physicsMaterial = new CANNON.Material('physics');
	const playerBody = new CANNON.Body({ mass: 1, material: physicsMaterial });
	playerBody.friction = 0.0;
	playerBody.allowSleep = false;
	playerBody.collisionFilterGroup = 2;
	playerBody.fixedRotation = true;
	playerBody.updateMassProperties();
	playerBody.addShape(sphereShape);
	playerBody.position.set(0, 5, 0);
	playerBody.linearDamping = 0.9;
	physicsEngine.addBody(playerBody);

	console.log(playerBody);

	const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x22ffaa, wireframe: true });
	const playerDebugMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), debugMaterial);
	playerDebugMesh.position.copy(playerBody.position);
	scene.add(playerDebugMesh);	

	const acceleration = new THREE.Vector3(1, 1, 10.0);


	this.update = function(timeElapsed) {
		if (!character) return;
		const timeInSeconds = timeElapsed * 0.001;
		if (stateMachine) stateMachine.update(timeInSeconds, input);
		if (mixer) mixer.update(timeInSeconds);

		const v = new THREE.Vector3();
		if (input.forward) {
			v.z += acceleration.z * timeInSeconds;
		}
		if (input.backward) {
			v.z -= acceleration.z * timeInSeconds;
		}

		const forward = new THREE.Vector3(0, 0, 1);
		forward.applyQuaternion(playerBody.quaternion);
		forward.normalize();
		forward.multiplyScalar(v.z * timeElapsed);

		playerBody.velocity.set(forward.x, forward.y, forward.z);


		playerDebugMesh.position.copy(playerBody.position);
		playerDebugMesh.quaternion.copy(playerBody.quaternion);
	};
}

export { CharacterController };