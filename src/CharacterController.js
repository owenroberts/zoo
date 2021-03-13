import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CharacterFSM, IdleState, DanceState, WalkState, RunState } from './CharacterStates';
import { CharacterControllerInput } from './CharacterControllerInput';


function CharacterController(scene, camera, physicsEngine, castList) {
	
	let character, mixer, stateMachine;
	let radius = 1, playerBody, playerDebugMesh, axesHelper, boundingBox;
	const animations = {};
	const input = new CharacterControllerInput();
	const groundRaycaster = new THREE.Raycaster();
	const groundRay = new THREE.Vector3(0, -1, 0);

	const modelContainer = new THREE.Group(); // used to ground character
	scene.add(modelContainer);

	// toon material - put this somewhere else if making lots of these (of same color)
	const alpha = 5, beta = 5, gamma = 5;
	const colors = new Uint8Array( 2 );
	for ( let c = 0; c <= colors.length; c++) {
		colors[c] = 64 + (c / colors.length) * (256 - 64);
	}
	const gradientMap = new THREE.DataTexture( colors, colors.length, 1, THREE.LuminanceFormat );
	gradientMap.minFilter = THREE.NearestFilter;
	gradientMap.magFilter = THREE.NearestFilter;
	gradientMap.generateMipmaps = false;
	const diffuseColor = new THREE.Color()
		.setHSL(alpha, 0.5, gamma * 0.5 + 0.1).multiplyScalar(1 - beta * 0.2);
	const material = new THREE.MeshToonMaterial( {
		color: 0x6e619e,
		gradientMap: gradientMap,
		emissive: new THREE.Color(0x1e00ff),
		skinning: true,
		shininess: 0,
		specular: new THREE.Color(0x00000),
	});
	const eyeMaterial = new THREE.MeshToonMaterial( {
		color: 0xffffff,
		gradientMap: gradientMap,
		emissive: new THREE.Color(0x1e00ff),
		skinning: true,
		shininess: 0,
		specular: new THREE.Color(0x00000),
	});

	// console.log(material);

	loadModels();

	function initCharacter() {
		stateMachine = new CharacterFSM(animations);
		stateMachine.set('Idle1');
		characterPhysics();
	}

	function loadModels() {
		const loader = new GLTFLoader();
		loader.setPath('./static/models/');
		loader.load('zoo-1.glb', gltf => {
			console.log(gltf);
			
			character = gltf.scene;
			character.scale.setScalar(0.5);
			character.rotation.y = -Math.PI * 0.66;
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

			character.position.y = -1.25;
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
			initCharacter();
		});
	}

	// get pos and rot for camera
	this.getPosition = function() {
		return modelContainer.position.clone();
	};

	this.getRotation = function() {
		return modelContainer.quaternion.clone();
	};

	const contactNormal = new CANNON.Vec3();
	const upAxis = new CANNON.Vec3(0, 1, 0);

	function characterPhysics() {
		const box = new THREE.Box3().setFromObject(character);
		boundingBox = new THREE.BoxHelper(character);
		// console.log(boundingBox.geometry.boundingSphere.radius);
		// console.log(boundingBox);
		// scene.add(boundingBox);

		radius = boundingBox.geometry.boundingSphere.radius;
		
		const sphereShape = new CANNON.Sphere(radius / 2);
		const physicsMaterial = new CANNON.Material('physics');
		playerBody = new CANNON.Body({ mass: 5, material: physicsMaterial });
		playerBody.friction = 0.9;
		playerBody.allowSleep = false;
		playerBody.collisionFilterGroup = 2;
		// playerBody.fixedRotation = true;
		playerBody.updateMassProperties();
		playerBody.addShape(sphereShape);
		playerBody.position.set(0, 2, 0);
		playerBody.linearDamping = 0.99;
		playerBody.angularDamping = 0.99;
		physicsEngine.addBody(playerBody);

		axesHelper = new THREE.AxesHelper( 1 );
		scene.add( axesHelper );

		const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x22ffaa, wireframe: true });
		playerDebugMesh = new THREE.Mesh(new THREE.SphereGeometry(radius/2, 8, 8), debugMaterial);
		playerDebugMesh.position.copy(playerBody.position);
		scene.add(playerDebugMesh);
		
		playerBody.addEventListener('collide', playerCollision);
		character.visible = true;

		console.log(playerBody);
	}

	function playerCollision(ev) {
		let contact = ev.contact;
		if (contact.bi.id == playerBody.id) {
			contact.ni.negate(contactNormal);
		} else {
			contactNormal.copy(contact.ni);
		}
		if (contactNormal.dot(upAxis) > 0.5) jump.count = 0;
	}

	const decceleration = new THREE.Vector3(-0.0005, -0.0001, -10.0);
	const acceleration = new THREE.Vector3(1, 1, 1.0);
	const velocity = new THREE.Vector3(0, 0, 0);
	let jump = {
		count: 0,
		started: false,
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

		if (input.jump && !jump.started) {
			if (jump.count < 2) {
				jump.count++;
				jump.started = true;
			}
		} else if (!input.jump && jump.started) {
			jump.started = false;
			playerBody.velocity.y = 20;
		}

		const acc = acceleration.clone();
		if (input.run) {
			acc.multiplyScalar(1 * (input.backward ? 1.5 : 2.0));
		}

		if (input.forward) {
			v.z += acc.z * timeElapsed;
		}
		if (input.backward) {
			v.z -= acc.z * timeElapsed;
		}
		if (input.left) {
			_A.set(0, 1, 0);
			_Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * acc.y);
			_R.multiply(_Q);
		}
		if (input.right) {
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
			const intersects = groundRaycaster.intersectObjects(physicsEngine.getCastList());
			for (let i = 0; i < intersects.length; i++) {
				if (intersects[i].distance < 2.5) endOfJump = true;
			}
		}

		// console.log(playerBody.velocity.y);
		if (stateMachine) stateMachine.update(input, jump, endOfJump);
		if (mixer) mixer.update(timeInSeconds);
	};
}

export { CharacterController };