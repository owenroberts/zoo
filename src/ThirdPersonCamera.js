import * as THREE from 'three';

function ThirdPersonCamera(camera, target) {
	
	const currentPosition = new THREE.Vector3();
	const currentLookAt = new THREE.Vector3();

	document.addEventListener('keydown', ev => onKey(ev, true), false);
	document.addEventListener('keyup', ev => onKey(ev, false), false);

	const ideal = {
		offsetOrigin: { x: -3, y: 6, z: -8, },
		offset: { x: -3, y: 6, z: -8, },
		look: { x: 0, y: 2, z: 0 },
	};
	const cameraOrbitSpeed = 5;
	const camearMoveSpeed = 0.1;
	const input = {
		left: false,
		right: false,
		up: false,
		down: false,
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
			case 79: // o reset
				if (isDown) resetCameraPosition();
				break;
		}
	}


	function rotateCamera(toLeft) {
		const radius = new THREE.Vector2(camera.position.x, camera.position.z)
			.distanceTo(new THREE.Vector2(target.getPosition().x, target.getPosition().z));
		let vec = new THREE.Vector2(camera.position.x, camera.position.z).sub(new THREE.Vector2(target.getPosition().x, target.getPosition().z));
		let angle = Math.atan2(vec.x, vec.y) * (180 / Math.PI);
		angle += cameraOrbitSpeed * (toLeft ? -1 : 1);
		ideal.offset.x = radius * Math.sin(Math.PI * 2 * angle / 360);
		ideal.offset.z = radius * Math.cos(Math.PI * 2 * angle / 360);
	}

	function moveCamera(moveUp) {
		// const radius = camera.position.distanceTo(new THREE.Vector3(0, 2, 0));
		// let angle = camera.position.angleTo(new THREE.Vector3(0, 2, 0));
		ideal.offset.y += camearMoveSpeed * (moveUp ? -1 : 1);
	}

	function resetCameraPosition() {
		ideal.offset.x = ideal.offsetOrigin.x;
		ideal.offset.y = ideal.offsetOrigin.y;
		ideal.offset.z = ideal.offsetOrigin.z;
	}

	function calculateIdealOffset() {
		// const idealOffset = new THREE.Vector3(-3, 6, -8);
		const idealOffset = new THREE.Vector3(ideal.offset.x, ideal.offset.y, ideal.offset.z);
		idealOffset.applyQuaternion(target.getRotation());
		idealOffset.add(target.getPosition());
		return idealOffset;
	}

	function calculateIdealLookat() {
		const idealLookAt = new THREE.Vector3(0, 2, 0);
		idealLookAt.applyQuaternion(target.getRotation());
		idealLookAt.add(target.getPosition());
		return idealLookAt;
	}

	this.update = function(timeElapsed) {

		// update cam position // testing or feature?
		if (input.left || input.right) rotateCamera(input.left);
		if (input.up || input.down) moveCamera(input.up);

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
