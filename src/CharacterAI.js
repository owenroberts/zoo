/*
	controls ai behaviors ... 
*/

import * as THREE from 'three';

export default function CharacterAI(input, controller, dialog, debug) {

	this.isAI = true;
	this.controller = controller;
	if (debug) controller.setDebug();

	// params for different types/species ?
	const flockRadius = 10;
	const threshold = 0.5;
	const alignLevel = 1; // smaller is more aligned
	const centerLevel = 20; // smaller is more centered
	const seperationLevel = 10; // smaller more seperate

	// player talk vars
	const playerTalkDistance = 5;
	let talkedToPlayer = false;

	function checkPlayer(player) {
		let { position } = controller.getProps();
		let distance = position.distanceTo(player.position);
		return distance < playerTalkDistance;
	}

	function calculateAlignment(other) {
		let { position, velocity } = controller.getProps();
		let alignment = new THREE.Vector3(); // alignment
		alignment.add(other.velocity);
		alignment.sub(velocity);
		return alignment;
	}

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
		if (!input || !controller) return;

		if (!talkedToPlayer && !others[0].isTalking && !input.jump) {
			if (checkPlayer(others[0])) {
				talkedToPlayer = true;
				input.killActions();
				
				// turn to player ... 
				let alignment = calculateAlignment(others[0]);
				// console.log('align', alignment.z > threshold, alignment.z < -threshold);
				// console.log(Math.abs(alignment.z) );
				let alignTime = 0;
				if (Math.abs(alignment.z) > threshold) {
					alignTime = Math.abs(alignment.z) * 2.5;
					input.addAction(alignment.z > 0 ? 'left' : 'right', alignTime);
				}
				input.addAction('talk', 30, alignTime + 5); // delay
				window.postMessage({ aiMessage: dialog });
			}
		}

		if (talkedToPlayer) {
			// console.log(input);
		}
		
		if (!input.hasAction('talk')) {
			this.flock(others);
		}

		input.update(timeElapsed);
		controller.update(timeElapsed);
	};

}