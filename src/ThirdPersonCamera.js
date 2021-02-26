import * as THREE from 'three';

function ThirdPersonCamera(camera, target) {
	
	const currentPosition = new THREE.Vector3();
	const currentLookAt = new THREE.Vector3();

	document.addEventListener('keydown', ev => onKey(ev, true), false);
	document.addEventListener('keyup', ev => onKey(ev, false), false);

	const offsetOrigin = new THREE.Vector3(-3, 6, -8);
	const offset = new THREE.Vector3(-3, 6, -8);
	const lookOffset = new THREE.Vector3(0, 2, 0);
	const orbitSpeed = 0.75;
	const cameraMoveSpeed = 0.1;
	const zoomSpeed = 0.5;
	
	const input = {
		left: false,
		right: false,
		up: false,
		down: false,
		zoomIn: false,
		zoomOut: false,
	};

	function onKey(event, isDown) {
		switch (event.keyCode) {
			case 74: // j camera left
				input.left = isDown;
				break;
			case 76: // l camera right
				input.right = isDown;
				break;
			case 73: // i camera down
				input.down = isDown;
				break;
			case 75: // k camera up
				input.up = isDown;
				break;
			case 186: // o reset
				if (isDown) resetCameraPosition();
				break;
			case 85:
				input.zoomOut = isDown;
				break;
			case 79:
				input.zoomIn = isDown;
				break;
		}
	}


	function rotateCamera(timeElapsed) {

		const center = target.getPosition().add(lookOffset);
		const position = offset.clone();
		position.sub(center);
		
		const axis = new THREE.Vector3(0, 0, 0);
		if (input.right || input.left) axis.y = 1;
		else if (input.up || input.down) {
			axis.x = 1;
			axis.applyQuaternion(camera.quaternion.clone());
		}
		axis.normalize();
		const theta = orbitSpeed * timeElapsed * ((input.left || input.down) ? -1 : 1);

		position.applyAxisAngle(axis, theta);
		position.add(center);
		// position.rotateOnAxis(axis, theta);
		offset.copy(position.clone());

	}

	function zoomCamera(timeElapsed) {
		let zoom = input.zoomIn ? 1 - timeElapsed * zoomSpeed : 1 + timeElapsed * zoomSpeed;
		let center = target.getPosition().add(lookOffset)
		offset.sub(center).multiplyScalar(zoom).add(center);
	}

	function moveCamera(moveUp) {
		// const radius = camera.position.distanceTo(new THREE.Vector3(0, 2, 0));
		// let angle = camera.position.angleTo(new THREE.Vector3(0, 2, 0));
		ideal.offset.y += cameraMoveSpeed * (moveUp ? -1 : 1);
	}

	function resetCameraPosition() {
		offset.copy(offsetOrigin.clone());
	}

	function calculateIdealOffset() {
		const idealOffset = offset.clone();
		idealOffset.applyQuaternion(target.getRotation());
		idealOffset.add(target.getPosition());
		return idealOffset;
	}

	function calculateIdealLookat() {
		const idealLookAt = lookOffset.clone();
		idealLookAt.applyQuaternion(target.getRotation());
		idealLookAt.add(target.getPosition());
		return idealLookAt;
	}

	this.update = function(timeElapsed) {

		// update cam position // testing or feature?
		if (input.left || input.right || input.up || input.down) rotateCamera(timeElapsed);
		if (input.zoomIn || input.zoomOut) zoomCamera(timeElapsed);

		const idealOffset = calculateIdealOffset();
		const idealLookAt = calculateIdealLookat();

		const t = 1.0 - Math.pow(0.001, timeElapsed);

		currentPosition.lerp(idealOffset, t);
		currentLookAt.lerp(idealLookAt, t);

		camera.position.copy(currentPosition);
		camera.lookAt(currentLookAt);
	}
}

export { ThirdPersonCamera };
