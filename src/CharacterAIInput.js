/*
	drives character actions ...
*/

import { choice, random, chance } from './Cool';

export default function CharacterAIInput(debug) {

	this.isAI = true;
	
	let actions = {};
	let isMoving = false;
	const keys = {
		forward: false,
		backward: false,
		left: false,
		right: false,
		jump: false,
		run: false,
	};

	for (const key in keys) {
		Object.defineProperty(this, key, {
			get: function() {
				return keys[key]
			}
		});
	};

	function addActions() {
		
		// reset everything
		actions = [];
		for (const key in keys) {
			keys[key] = false;
		}
		
		if (chance(0.5)) {
			actions.push(new Action('forward', random(100, 200)));
			// if (chance(0.1)) actions.push(new Action('run', random(50, 100)));
			if (chance(0.2)) actions.push(new Action(chance(0.5) ? 'left' : 'right', random(25, 50)));
		} else if (chance(0.25)) {
			// actions.push(new Action('backward', random(100, 200)));
		}
	}

	this.update = function(timeElapsed) {
		// if (actions.every(a => a.finished) && isMoving) {
		// 	// addActions();
		// }

		for (const key in actions) {
			actions[key].count += timeElapsed;
			if (actions[key].count > actions[key].interval) {
				keys[key] = false;
				delete actions[key];
			}
		}
	};

	this.setKey = function(key, value) {
		keys[key] = value;
	};

	this.addAction = function(key, duration) {
		if (isMoving) {
			keys[key] = true;
			actions[key] = {
				count: 0,
				interval: duration * 100
			};
		}
	};

	// wait til char hits ground to move
	this.onHitGround = function() {
		if (!isMoving) {
			isMoving = true;
			// keys.forward = true;
		}
	};

	this.onHitWall = function() {
		if (chance(0.5)) this.addAction('jump', 1);
	};


}