import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CharacterFSM, IdleState, DanceState, WalkState, RunState } from './CharacterStates';
import { CharacterControllerInput } from './CharacterControllerInput';
import getToonMaterial from './ToonMaterial';
import { random } from './Cool';

function CharacterController(scene, physics, modelLoader, input, position) {
	
	let mesh, mixer, stateMachine;
	let body, debugMesh, axesHelper;
	let container;
	
	const animations = {};
	const contactNormal = new CANNON.Vec3();
	const upAxis = new CANNON.Vec3(0, 1, 0);

	const decceleration = new THREE.Vector3(-0.0005, -0.0001, -10.0);
	const acceleration = new THREE.Vector3(0.5, 0.5, 1.0);
	const velocity = new THREE.Vector3(0, 0, 0);
	let jump = {
		count: 0,
		started: false,
		firstJumpVelocity: 30,
		secondJumpVelocity: 20,
	};

	const groundRaycaster = new THREE.Raycaster();
	const groundRay = new THREE.Vector3(0, -1, 0);

	init();
	
	function init() {
		container = new THREE.Group(); // used to ground mesh
		scene.add(container);
		
		const material = getToonMaterial({
			color: 0x6e619e,
			skinning: true,
			emissiveColor: 0x1e00ff,
		});

		const eyeMaterial = getToonMaterial({
			color: 0xffffff,
			skinning: true,
			emissiveColor: 0x1e00ff,
		});

		const gltf = modelLoader.getGLTF('characters', 'a');
		mesh = gltf.scene;
		mesh.scale.setScalar(0.5); // set scale in blender? -- not sure
		mesh.traverse(c => {
			if (c.constructor.name == 'SkinnedMesh') {
				c.castShadow = true;
				if (c.material.name == 'EyeMaterial') {
					c.material = eyeMaterial;
				} else {
					c.material = material;
				}
			}
		});
		container.add(mesh);

		mixer = new THREE.AnimationMixer(mesh);
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

		// physics
		const box = new THREE.Box3().setFromObject(mesh);

		const radius = (box.max.y - box.min.y) / 2;
		mesh.position.y -= radius;

		const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x22ffaa, wireframe: true });
		debugMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), debugMaterial);
		scene.add(debugMesh);

		// mesh.rotation.y = -Math.PI * 0.66;
		mesh.rotation.y = -Math.PI * 0.5;
		
		const sphereShape = new CANNON.Sphere(radius);
		const physicsMaterial = new CANNON.Material('physics');
		body = new CANNON.Body({ mass: 5, material: physicsMaterial });
		body.friction = 0.9;
		body.allowSleep = false;
		body.collisionFilterGroup = 2;
		// body.fixedRotation = true;
		body.updateMassProperties();
		body.addShape(sphereShape);

		if (position) body.position.set(...position);
		else body.position.set(0, 10, 0);

		
		body.linearDamping = 0.99;
		body.angularDamping = 0.99;
		body.collisionFilterGroup = 1;
		body.collisionFilterMask = 1;
		physics.addBody(body);

		if (input.isAI) {
			container.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), random(Math.PI * 2));
		}

		axesHelper = new THREE.AxesHelper( 1 );
		scene.add( axesHelper );
		
		body.addEventListener('collide', onCollision);
	}

	function onCollision(ev) {
		let contact = ev.contact;
		if (contact.bi.id == body.id) {
			contact.ni.negate(contactNormal);
		} else {
			contactNormal.copy(contact.ni);
		}
		if (contactNormal.dot(upAxis) > 0.5) {
			jump.count = 0;
			if (input.isAI) input.onHitGround();
		} else {
			if (input.isAI) input.onHitWall();
		}
	}

	this.update = function(timeElapsed) {
		if (!mesh || !body) return;
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

		const controlObject = container;
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
				body.velocity.y = jump.firstJumpVelocity;
			}
		} else if (!input.jump && jump.started) {
			jump.started = false;
			jump.count++;
			body.velocity.y = jump.secondJumpVelocity;
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

		body.velocity.x += forward.x;
		body.velocity.y += forward.y;
		body.velocity.z += forward.z;

		body.velocity.x += sideways.x;
		body.velocity.y += sideways.y;
		body.velocity.z += sideways.z;

		axesHelper.position.copy(body.position);
		axesHelper.quaternion.copy(controlObject.quaternion);

		container.position.copy(body.position);

		debugMesh.position.copy(body.position);
		debugMesh.quaternion.copy(body.quaternion);

		// check if player is about to hit ground
		let endOfJump = false; 
		if (jump.count > 0 && body.velocity.y < 5) {
			groundRaycaster.set(container.position.clone(), groundRay.clone());
			const intersects = groundRaycaster.intersectObjects(physics.getCastList());
			for (let i = 0; i < intersects.length; i++) {
				if (intersects[i].distance < 2.5) endOfJump = true;
			}
		}

		// console.log(body.velocity.y);
		if (stateMachine) stateMachine.update(input, jump, endOfJump);
		if (mixer) mixer.update(timeInSeconds);
	};

	// get pos and rot for camera
	this.getPosition = function() {
		return container.position.clone(); // using container vs body?
		// actually not currently using this anywhere ...
	};

	this.getRotation = function() {
		return container.quaternion.clone();
	};

	this.getVelocity = function() {
		return body.velocity;
	};

}

export { CharacterController };