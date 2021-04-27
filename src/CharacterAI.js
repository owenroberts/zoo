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
	const threshold = 1;
	const alignLevel = 2; // smaller is more aligned
	const centerLevel = 1; // smaller is more centered
	const seperationLevel = 1; // smaller more seperate

	const normalQuaternion = new THREE.Quaternion();
	
	const playerTalkDistance = 5;
	let talkedToPlayer = false;

	function checkPlayer(player) {
		let { position } = controller.getProps();
		let distance = position.distanceTo(player.position);
		return distance < playerTalkDistance;
	}

	function directionTo(target) { // other is player here
		let { position, quaternion } = controller.getProps();

		const start = new THREE.Object3D();
		start.position.copy(position);
		start.quaternion.copy(quaternion);

		const end = start.clone();
		end.lookAt(target);

		const startLargerThanHalfPI = start.quaternion.angleTo(normalQuaternion) > Math.PI / 2;
		const endLargerThanHalfPI = end.quaternion.angleTo(normalQuaternion) > Math.PI / 2;
		const startAngleLargerThanEnd = Math.abs(start.rotation.y) > Math.abs(end.rotation.y);

		let dir = Math.sign(start.rotation.y - end.rotation.y);

		if ((endLargerThanHalfPI && !startLargerThanHalfPI && startAngleLargerThanEnd) ||
  			(startLargerThanHalfPI && (endLargerThanHalfPI || !startAngleLargerThanEnd))) {
      		dir *= -1;
  		}

		// return dir > 0 ? 'right' : 'left';
		return dir * start.quaternion.angleTo(end.quaternion);
	}

	function talkToPlayer(player) {
		if (checkPlayer(player)) {
			talkedToPlayer = true;
			input.killActions();
			// turn to player ... 
			let direction = directionTo(player.position);
			const alignTime = Math.abs(direction) * 3;
			input.addAction(direction > 0 ? 'right' : 'left', alignTime);
			input.addAction('talk', 30, alignTime + 1, () => {
				window.postMessage({ aiMessage: dialog });
			});
		}
	}

	function flock(others) {
		const { id, position, velocity, quaternion } = controller.getProps();
		const v = new THREE.Vector3(); // flock velocity
		const center = new THREE.Vector3();
		// center.add(position);

		let total = 0;

		for (let i = 0; i < others.length; i++) {
			const other = others[i];
			if (other.id != id) {
				const distance = position.distanceTo(other.position);
				if (distance < flockRadius) {
					total++;
					center.add(other.position);
					v.add(other.velocity);

					// separation
					const dist = other.position.clone().sub(position);
					dist.divideScalar(distance);
					dist.multiplyScalar((flockRadius - distance)); // seperationLevel
					dist.multiplyScalar(seperationLevel);
					center.sub(dist);
				}
			}
		}

		center.divideScalar(total);

		v.divideScalar(total);
		v.multiplyScalar(alignLevel); // align level
		center.add(v);

		// turn toward center
		const direction = directionTo(center);
		// log.innerHTML = direction;
		if (Math.abs(direction) > Math.PI / 4) {
 			const alignTime = Math.abs(direction) * 2;
			input.addAction(direction > 0 ? 'right' : 'left', alignTime);
		}
		
		if (total > 0) {
			const dist = position.distanceTo(center);
			if (dist > 2) input.addAction('forward', dist);
		}

		// window.postMessage({
		// 	testAxes: {
		// 		position: center,
		// 		quaternion: new THREE.Quaternion().toArray(),
		// 		length: 1
		// 	}
		// });
	}

	this.update = function(timeElapsed, others) {
		if (!input || !controller) return;

		// if (!talkedToPlayer && !others[0].isTalking && !input.jump) talkToPlayer(others[0])

		if (!input.hasAction('talk')) {
			if (controller.sniffCheck(others)) {
				input.killActions();
				input.addAction('sniff', 20);
			}
		}

		if (!input.hasAction('talk') && !input.hasAction('sniff')) {
			flock(others);
		}

		input.update(timeElapsed);
		controller.update(timeElapsed);
	};

}