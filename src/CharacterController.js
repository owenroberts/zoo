import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CharacterFSM } from './CharacterStates';
import { CharacterControllerInput } from './CharacterControllerInput';
import getToonMaterial from './ToonMaterial';
import { choice, random } from './Cool';

function CharacterController(scene, physics, modelLoader, input, position) {
	
	let debug = false;
	if (!input.isAI) {
		this.isPlayer = true;
		this.isTalking = false;
	}

	let mesh, mixer, stateMachine;
	let body, debugMesh, axesHelper;
	let radius;

	const texturePath = `./static/textures/pixels/character-${choice(1,2,3,4,5)}.png`;
	const container = new THREE.Group();

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
	const buttSniffDistance = 0.5;

	init();

	function init() {
		scene.add(container);

		const texture = new THREE.TextureLoader().load(texturePath);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 16, 16 );
		
		const material = getToonMaterial({
			color: 0x6e619e,
			skinning: true,
			emissiveColor: 0x1e00ff,
			map: texture,
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
				c.receiveShadow = true;
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

		radius = (box.max.y - box.min.y) / 2;
		mesh.position.y -= radius;

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
		body.isAI = input.isAI;
		body.isPlayer = !input.isAI;

		if (position) body.position.set(...position);
		else body.position.set(0, 10, 0);

		body.linearDamping = 0.99;
		body.angularDamping = 0.99;
		body.collisionFilterGroup = 1;
		body.collisionFilterMask = 1;
		physics.addBody(body);

		if (input.isAI) {
			container.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), random(Math.PI * 2));
			// container.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), -Math.PI + 0.001);
		}

		if (debug) {
			const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x22ffaa, wireframe: true });
			debugMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), debugMaterial);
			scene.add(debugMesh);

			axesHelper = new THREE.AxesHelper( 1 );
			scene.add( axesHelper );

			// const buttPos = new THREE.AxesHelper(0.5);
			// buttPos.position.set(0, 0, -radius);
			// container.add(buttPos);

			// const facePos = new THREE.AxesHelper(0.5);
			// facePos.position.set(0, 0, radius + 0.5);
			// container.add(facePos);

		}
		
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

	function applyVelocity(timeElapsed, timeInSeconds) {
		
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

		body.velocity.x += forward.x;
		body.velocity.y += forward.y;
		body.velocity.z += forward.z;

		body.velocity.x += sideways.x;
		body.velocity.y += sideways.y;
		body.velocity.z += sideways.z;
	}

	this.update = function(timeElapsed) {
		if (!mesh || !body) return;
		const timeInSeconds = timeElapsed * 0.001;
		
		// if (input.talk) console.log(input.talk, input.forward, input.left, input.right);
		applyVelocity(timeElapsed, timeInSeconds);
		container.position.copy(body.position); // update mesh position

		let endOfJump = false; // check if player is about to hit ground
		if (jump.count > 0 && body.velocity.y < 5) {
			groundRaycaster.set(container.position.clone(), groundRay.clone());
			const intersects = groundRaycaster.intersectObjects(physics.getCastList());
			for (let i = 0; i < intersects.length; i++) {
				if (intersects[i].distance < 2.5) endOfJump = true;
			}
		}

		if (stateMachine) stateMachine.update(input, jump, endOfJump);
		if (mixer) mixer.update(timeInSeconds);

		if (debug) {
			axesHelper.position.copy(body.position);
			axesHelper.quaternion.copy(container.quaternion);
			debugMesh.position.copy(body.position);
			debugMesh.quaternion.copy(body.quaternion);
		}
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

	this.getProps = function() {
		return {
			id: body.id,
			velocity: body.velocity,
			position: container.position.clone(),
			quaternion: container.quaternion.clone(),
			radius: radius,
			isTalking: this.isTalking,
		};
	};

	this.sniffCheck = function(others) {
		const face = new THREE.Object3D();
		face.applyQuaternion(container.quaternion);
		face.position.copy(container.position);
		face.translateZ(radius + 0.5);

		for (let i = 0; i < others.length; i++) {
			if (others[i].id != body.id) {
				const butt = new THREE.Object3D();
				butt.applyQuaternion(others[i].quaternion);
				butt.position.copy(others[i].position);
				butt.translateZ(-others[i].radius);
				return face.position.distanceTo(butt.position) < buttSniffDistance;
			}
		}

		return false;
	};

	this.setDebug = function(isDebug) {
		debugMesh.material = new THREE.MeshBasicMaterial({ color: 0xaaddff, wireframe: true });
		stateMachine.debug = isDebug;
		debug = isDebug;
	};
}

export { CharacterController };