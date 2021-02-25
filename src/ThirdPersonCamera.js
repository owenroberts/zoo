import * as THREE from 'three';

class ThirdPersonCamera {
	constructor(camera, target) {
		this.camera = camera;
		this.target = target;

		this.currentPosition = new THREE.Vector3();
		this.currentLookAt = new THREE.Vector3();

		document.addEventListener('keydown', ev => this.onKey(ev, true), false);

		this.ideal = {
			offsetOrigin: { x: -3, y: 6, z: -8, },
			offset: { x: -3, y: 6, z: -8, },
			look: { x: 0, y: 2, z: 0 },
		};

		this.theta = { x: 0, y: 0, z: 0 };
		this.camSpeed = 5;

	}

	onKey(event, isDown) {
		const key = event.keyCode;
		console.log(key);
		if ([74,76].includes(key)) {
			const radius = new THREE.Vector2(this.camera.position.x, this.camera.position.z).distanceTo(new THREE.Vector2(0, 0));
			let angle = Math.atan2(this.camera.position.x, this.camera.position.z) * (180 / Math.PI);

			if (key == 74) { // j camera left
				angle -= this.camSpeed;
			}
			if (key == 76) {  // l camera right
				angle += this.camSpeed;
			}
			this.ideal.offset.x = radius * Math.sin(Math.PI * 2 * angle / 360);
			this.ideal.offset.z = radius * Math.cos(Math.PI * 2 * angle / 360);
				
		} else if ([73,75].includes(key)) {
			// why am i working out orbit controls .... 
			const radius = this.camera.position.distanceTo(new THREE.Vector3(0, 2, 2));
			let angle = this.camera.position.angleTo(new THREE.Vector3(0, 2, 0));
			// console.log(angle);
			if (key == 73) {  // i camera down
				// angle += 0.001;
				this.ideal.offset.y += this.camSpeed / 10;
			}
			if (key == 75) { // k camera up
				// angle -= 0.001;
				this.ideal.offset.y -= this.camSpeed / 10;

			}
			// this.ideal.offset.x = radius * Math.sin(angle);
			// this.ideal.offset.y = radius * Math.sin(angle);
			// this.ideal.offset.z = radius * Math.cos(angle);
		} else if (key == 79) {// o reset
			this.ideal.offset.x = this.ideal.offsetOrigin.x;
			this.ideal.offset.y = this.ideal.offsetOrigin.y;
			this.ideal.offset.z = this.ideal.offsetOrigin.z;
		}
	}


	calculateIdealOffset() {
		// const idealOffset = new THREE.Vector3(-3, 6, -8);
		const idealOffset = new THREE.Vector3(this.ideal.offset.x, this.ideal.offset.y, this.ideal.offset.z);
		idealOffset.applyQuaternion(this.target.getRotation());
		idealOffset.add(this.target.getPosition());
		return idealOffset;
	}

	calculateIdealLookat() {
		const idealLookAt = new THREE.Vector3(0, 2, 0);
		idealLookAt.applyQuaternion(this.target.getRotation());
		idealLookAt.add(this.target.getPosition());
		return idealLookAt;
	}

	update(timeElapsed) {

		// update cam position // testing or feature?
		

		const idealOffset = this.calculateIdealOffset();
		const idealLookAt = this.calculateIdealLookat();

		const t = 1.0 - Math.pow(0.001, timeElapsed);

		this.currentPosition.lerp(idealOffset, t);
		this.currentLookAt.lerp(idealLookAt, t);

		this.camera.position.copy(this.currentPosition);
		this.camera.lookAt(this.currentLookAt);
		// this.camera.updateMatrixWorld();
	}
}

export { ThirdPersonCamera };
