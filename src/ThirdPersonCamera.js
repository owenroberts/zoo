import * as THREE from 'three';

class ThirdPersonCamera {
	constructor(camera, target) {
		this.camera = camera;
		this.target = target;

		this.currentPosition = new THREE.Vector3();
		this.currentLookAt = new THREE.Vector3();
	}

	calculateIdealOffset() {
		const idealOffset = new THREE.Vector3(-3, 6, -8);
		idealOffset.applyQuaternion(this.target.getRotation());
		idealOffset.add(this.target.getPosition());
		return idealOffset;
	}

	calculateIdealLookat() {
		const idealLookAt = new THREE.Vector3(0, 3, 5);
		idealLookAt.applyQuaternion(this.target.getRotation());
		idealLookAt.add(this.target.getPosition());
		return idealLookAt;
	}

	update(timeElapsed) {
		const idealOffset = this.calculateIdealOffset();
		const idealLookAt = this.calculateIdealLookat();

		const t = 1.0 - Math.pow(0.001, timeElapsed);

		this.currentPosition.lerp(idealOffset, t);
		this.currentLookAt.lerp(idealLookAt, t);

		this.camera.position.copy(this.currentPosition);
		this.camera.lookAt(this.currentLookAt);
	}
}

export { ThirdPersonCamera };
