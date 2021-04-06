/*
	controls ai behaviors ... 
*/

import * as THREE from 'three';

export default function CharacterAI(input, controller) {

	console.log(this);

	this.isAI = true;
	this.controller = controller;
	// input.setKey('forward', true);

	let flockRadius = 10;
	let threshold = 0.5;
	let centerLevel = 10; // smaller is more centered

	this.update = function(timeElapsed, others) {
		if (input && controller) {
			input.update(timeElapsed);
			controller.update(timeElapsed);
			this.flock(others);
		}
	};

	function align(others) {
		let steering = new THREE.Vector3(); // alignment
		let center = new THREE.Vector3(); // cohesion
		let separation = new THREE.Vector3(); // separation
		let total = 0;

		for (let i = 0; i < others.length; i++) {
			const other = others[i];
			if (other.controller != controller) {
				let distance = controller.getPosition().distanceTo(other.controller.getPosition());
				if (distance < flockRadius) {
					total++;
					steering.add(other.controller.getVelocity());
					center.add(other.controller.getPosition());
					
					// const diff = other.controller.getPosition().sub(controller.getPosition());
					const diff = controller.getPosition().sub(other.controller.getPosition());
					diff.divideScalar(distance);
					separation.add(diff);
				}
			}
		}

		if (total > 0) {
			// console.log(center);
			center.divideScalar(total);
			center.sub(controller.getPosition());
			center.divideScalar(10);

			steering.divideScalar(total);
			steering.sub(controller.getVelocity());
			steering.add(center);

			separation.divideScalar(total);
			separation.divideScalar(5);
			steering.add(separation);
		} else {
			return false;
		}
		return steering;
	};


	this.flock = function(others) {
		const alignment = align(others);

		if (alignment) {
			if (alignment.z > threshold) input.addAction('left', 1);
			else if (alignment.z < -threshold) input.addAction('right', 1);
		}
	};

	// steering -- add actions or apply force to body ??

}