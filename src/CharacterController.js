import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CharacterFSM, IdleState, DanceState, WalkState, RunState } from './CharacterStates';
import { CharacterControllerInput } from './CharacterControllerInput';
import getToonMaterial from './ToonMaterial';

function CharacterController(scene, physics) {
	
	let character, mixer, stateMachine;
	let playerBody, playerDebugMesh, axesHelper, boundingBox;
	let modelContainer, material, eyeMaterial;
	
	const animations = {};
	const input = new CharacterControllerInput();
	const groundRaycaster = new THREE.Raycaster();
	const groundRay = new THREE.Vector3(0, -1, 0);

	init();
	
	function init() {
		modelContainer = new THREE.Group(); // used to ground character
		scene.add(modelContainer);
		
		material = getToonMaterial({
			color: 0x6e619e,
			skinning: true,
			emissiveColor: 0x1e00ff,
		});

		eyeMaterial = getToonMaterial({
			color: 0xffffff,
			skinning: true,
			emissiveColor: 0x1e00ff,
		});

		loadModels();
	}

	function loadModels() {
		const loader = new GLTFLoader();
		loader.setPath('./static/models/');
		loader.load('zoo-2.glb', gltf => {
			console.log(gltf);
			
			character = gltf.scene;
			character.scale.setScalar(0.5); // set scale in blender? -- not sure
			character.traverse(c => {
				if (c.constructor.name == 'SkinnedMesh') {
					c.castShadow = true;
					if (c.material.name == 'EyeMaterial') {
						c.material = eyeMaterial;
					} else {
						c.material = material;
					}
				}
			});
			character.visible = false;

			modelContainer.add(character);

			mixer = new THREE.AnimationMixer(character);
			for (let i = 0; i < gltf.animations.length; i++){
				const clip = gltf.animations[i];
				const action = mixer.clipAction(clip);
				animations[clip.name] = {
					clip: clip,
					action: action,
				}
			}
			stateMachine = new CharacterFSM(animations);
			stateMachine.set('Idle1');
			characterPhysics();
		});
	}

	function characterPhysics() {
		const box = new THREE.Box3().setFromObject(character);
		boundingBox = new THREE.BoxHelper(character);
		// modelContainer.add(boundingBox);

		const radius = (box.max.y - box.min.y) / 2;
		character.position.y -= radius;

		const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x22ffaa, wireframe: true });
		playerDebugMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), debugMaterial);
		scene.add(playerDebugMesh);

		// character.rotation.y = -Math.PI * 0.66;
		character.rotation.y = -Math.PI * 0.5;

		
		const sphereShape = new CANNON.Sphere(radius);
		const physicsMaterial = new CANNON.Material('physics');
		playerBody = new CANNON.Body({ mass: 5, material: physicsMaterial });
		playerBody.friction = 0.9;
		playerBody.allowSleep = false;
		playerBody.collisionFilterGroup = 2;
		// playerBody.fixedRotation = true;
		playerBody.updateMassProperties();
		playerBody.addShape(sphereShape);
		playerBody.position.set(0, 10, 0);
		playerBody.linearDamping = 0.99;
		playerBody.angularDamping = 0.99;
		playerBody.collisionFilterGroup = 1;
		playerBody.collisionFilterMask = 1;
		physics.addBody(playerBody);

		axesHelper = new THREE.AxesHelper( 1 );
		scene.add( axesHelper );
		
		playerBody.addEventListener('collide', playerCollision);
		character.visible = true;

		console.log(playerBody);
	}

	const contactNormal = new CANNON.Vec3();
	const upAxis = new CANNON.Vec3(0, 1, 0);

	function playerCollision(ev) {
		let contact = ev.contact;
		if (contact.bi.id == playerBody.id) {
			contact.ni.negate(contactNormal);
		} else {
			contactNormal.copy(contact.ni);
		}
		if (contactNormal.dot(upAxis) > 0.5) {
			jump.count = 0;
		}
	}

	const decceleration = new THREE.Vector3(-0.0005, -0.0001, -10.0);
	const acceleration = new THREE.Vector3(1, 1, 1.0);
	const velocity = new THREE.Vector3(0, 0, 0);
	let jump = {
		count: 0,
		started: false,
		firstJumpVelocity: 30,
		secondJumpVelocity: 20,
	};

	this.update = function(timeElapsed) {
		if (!character || !playerBody) return;
		const timeInSeconds = timeElapsed * 0.001;

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

		// almost there!

		if (input.jump && !jump.started && jump.count < 2) {
			if (jump.count == 0) {
				jump.started = true;
			}
			else if (jump.count == 1) {
				jump.count++;
				playerBody.velocity.y = jump.firstJumpVelocity;
			}
		} else if (!input.jump && jump.started) {
			jump.started = false;
			jump.count++;
			playerBody.velocity.y = jump.secondJumpVelocity;
		}

		const acc = acceleration.clone();
		if (input.run) {
			acc.multiplyScalar(1 * (input.backward ? 1.5 : 2.0));
		}

		if (input.forward && !input.jump) {
			v.z += acc.z * timeElapsed;
		}
		if (input.backward && !input.jump) {
			v.z -= acc.z * timeElapsed;
		}
		if (input.left && !input.jump) {
			_A.set(0, 1, 0);
			_Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * acc.y);
			_R.multiply(_Q);
		}
		if (input.right && !input.jump) {
			_A.set(0, 1, 0);
			_Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * acc.y);
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

		// check if player is about to hit ground
		let endOfJump = false; 
		if (jump.count > 0 && playerBody.velocity.y < 5) {
			groundRaycaster.set(modelContainer.position.clone(), groundRay.clone());
			const intersects = groundRaycaster.intersectObjects(physics.getCastList());
			for (let i = 0; i < intersects.length; i++) {
				if (intersects[i].distance < 2.5) endOfJump = true;
			}
		}

		// console.log(playerBody.velocity.y);
		if (stateMachine) stateMachine.update(input, jump, endOfJump);
		if (mixer) mixer.update(timeInSeconds);
	};

	// get pos and rot for camera
	this.getPosition = function() {
		return modelContainer.position.clone();
	};

	this.getRotation = function() {
		return modelContainer.quaternion.clone();
	};
}

export { CharacterController };