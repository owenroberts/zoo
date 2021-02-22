import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { CharacterFSM, IdleState, DanceState, WalkState, RunState } from './CharacterStates';
import { CharacterControllerInput } from './CharacterControllerInput';


function CharacterController(scene, camera, physicsEngine) {
	
	let character, mixer, stateMachine;
	let radius = 1, playerBody, playerDebugMesh, axesHelper, boundingBox;
	const animations = {};
	const input = new CharacterControllerInput();

	const modelContainer = new THREE.Group(); // used to ground character
	scene.add(modelContainer);

	let isLoaded = false;
	this.isReady = function() {
		return isLoaded;
	};

	loadModels();

	function initCharacter() {
		stateMachine = new CharacterFSM(animations);
		stateMachine.set('idle');
		isLoaded = true;
		characterPhysics();
	}

	function loadModels() {
		const loader = new FBXLoader();
		loader.setPath('./static/test_models/');
		loader.load('mremireh_o_desbiens.fbx', fbx => {
			fbx.scale.setScalar(0.01);
			fbx.traverse(c => { c.castShadow = true; });
			
			character = fbx;
			
			// const box = new THREE.Box3().setFromObject(character);
			// boundingBox = new THREE.BoxHelper(character);

			radius = 1; // calculate this later - with bounding box relative transform issue
			character.position.y = -1;
			modelContainer.add(character);
			console.log(character);

			mixer = new THREE.AnimationMixer(character);

			const manager = new THREE.LoadingManager();
			manager.onLoad = () => {
				initCharacter();
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
		return modelContainer.position;
	};

	this.getRotation = function() {
		if (!character) return new THREE.Quaternion();
		return modelContainer.quaternion;
	};

	function characterPhysics() {
		const sphereShape = new CANNON.Sphere(radius);
		const physicsMaterial = new CANNON.Material('physics');
		playerBody = new CANNON.Body({ mass: 5, material: physicsMaterial });
		playerBody.friction = 0.9;
		playerBody.allowSleep = false;
		playerBody.collisionFilterGroup = 2;
		// playerBody.fixedRotation = true;
		playerBody.updateMassProperties();
		playerBody.addShape(sphereShape);
		playerBody.position.set(0, 5, 0);
		playerBody.linearDamping = 0.99;
		playerBody.angularDamping = 0.99;
		physicsEngine.addBody(playerBody);

		axesHelper = new THREE.AxesHelper( 1 );
		scene.add( axesHelper );

		const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x22ffaa, wireframe: true });
		playerDebugMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), debugMaterial);
		playerDebugMesh.position.copy(playerBody.position);
		scene.add(playerDebugMesh);
		const contactNormal = new CANNON.Vec3();
		const upAxis = new CANNON.Vec3(0, 1, 0);
		playerBody.addEventListener('collide', ev => {
			let contact = ev.contact;
			if (contact.bi.id == playerBody.id)
				contact.ni.negate(contactNormal);
			else
				contactNormal.copy(contact.ni);
      
			if (contactNormal.dot(upAxis) > 0.5)
            	jumpCount = 0;
		});

		console.log(playerBody);
	}

	const decceleration = new THREE.Vector3(-0.0005, -0.0001, -10.0);
	const acceleration = new THREE.Vector3(5, 1, 1.0);
	const velocity = new THREE.Vector3(0, 0, 0);
	// let canJump = false;
	let jumpCount = 0;
	let jumpStarted = false;

	this.update = function(timeElapsed) {
		if (!character || !playerBody) return;
		const timeInSeconds = timeElapsed * 0.001;
		if (stateMachine) stateMachine.update(timeInSeconds, input);
		if (mixer) mixer.update(timeInSeconds);

		const v = velocity;
		const frameDecceleration = new THREE.Vector3(
			v.x * decceleration.x,
			v.y * decceleration.y,
			v.z * decceleration.z
		);
		frameDecceleration.multiplyScalar(timeElapsed);
		frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
			Math.abs(frameDecceleration.z), Math.abs(velocity.z));

		v.add(frameDecceleration);

		const controlObject = modelContainer;
		const _Q = new THREE.Quaternion();
		const _A = new THREE.Vector3();
		const _R = controlObject.quaternion.clone();

		if (input.space && !jumpStarted) {
			if (jumpCount < 2) {
				playerBody.velocity.y = 10;
				jumpCount++;
				jumpStarted = true;
			}
		} else if (!input.space && jumpStarted) {
			jumpStarted = false;
		}

		if (input.forward) {
			v.z += acceleration.z * timeElapsed;
		}
		if (input.backward) {
			v.z -= acceleration.z * timeElapsed;
		}
		if (input.left) {
			_A.set(0, 1, 0);
			_Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * acceleration.y);
			_R.multiply(_Q);
		}
		if (input.right) {
			_A.set(0, 1, 0);
			_Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * acceleration.y);
			_R.multiply(_Q);
		}

		controlObject.quaternion.copy(_R);

		const forward = new THREE.Vector3(0, 0, 1);
		forward.applyQuaternion(controlObject.quaternion);
		forward.normalize();

		const sideways = new THREE.Vector3(1, 0, 0);
		sideways.applyQuaternion(controlObject.quaternion);
		sideways.normalize();

		forward.multiplyScalar(v.z * timeInSeconds);
		sideways.multiplyScalar(v.x * timeInSeconds);
		// console.log(forward);

		playerBody.velocity.x += forward.x;
		playerBody.velocity.y += forward.y;
		playerBody.velocity.z += forward.z;

		playerBody.velocity.x += sideways.x;
		playerBody.velocity.y += sideways.y;
		playerBody.velocity.z += sideways.z;

		axesHelper.position.copy(playerBody.position);
		axesHelper.quaternion.copy(controlObject.quaternion);

		modelContainer.position.copy(playerBody.position);

		playerDebugMesh.position.copy(playerBody.position);
		playerDebugMesh.quaternion.copy(playerBody.quaternion);
	};
}

export { CharacterController };