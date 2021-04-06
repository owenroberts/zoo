/*
	controls ai behaviors ... 
*/

import * as THREE from 'three';

export default function CharacterAI(input, controller, debug) {
	const self = this;

	this.isAI = true;
	this.controller = controller;
	if (debug) {
		controller.setDebug();
	}

	// params for different types/species ?
	const flockRadius = 10;
	const threshold = 0.1;
	const alignLevel = 1; // smaller is more aligned
	const centerLevel = 10; // smaller is more centered
	const seperationLevel = 5; // smaller more seperate

	function steer(others) {
		let alignment = new THREE.Vector3(); // alignment
		let center = new THREE.Vector3(); // cohesion
		let separation = new THREE.Vector3(); // separation
		let total = 0;
		let { id, position, velocity, quaternion } = controller.getProps();

		for (let i = 0; i < others.length; i++) {
			const other = others[i];
			if (other.id != id) {
				let distance = position.distanceTo(other.position);
				if (distance < flockRadius) {
					total++;
					alignment.add(other.velocity);
					center.add(other.position);
					
					// const diff = other.controller.getPosition().sub(controller.getPosition());
					const diff = other.position.clone().sub(position);
					diff.divideScalar(distance);
					separation.add(diff);
				}
			}
		}

		if (total > 0) {
			alignment.divideScalar(total);
			alignment.divideScalar(alignLevel);
			alignment.sub(velocity);

			center.divideScalar(total);
			center.sub(position);
			center.divideScalar(centerLevel);
			center.applyQuaternion(quaternion);
			alignment.add(center);

			separation.divideScalar(total);
			separation.divideScalar(seperationLevel);
			alignment.add(separation);
		} else {
			return false;
		}
		return alignment;
	}

	this.flock = function(others) {
		const steering = steer(others);

		if (steering) {
			// if (debug) console.log(steering.z);
			if (steering.z > threshold) {
				input.addAction('left', 5);
				input.addAction('forward', 10);
			}
			else if (steering.z < -threshold) {
				input.addAction('right', 5);
				input.addAction('forward', 10);
			}
		}
	};

	this.update = function(timeElapsed, others) {
		if (input && controller) {
			this.flock(others);
			input.update(timeElapsed);
			controller.update(timeElapsed);
		}
	};

}