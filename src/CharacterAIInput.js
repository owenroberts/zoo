/*
	drives character actions ...
*/

import { choice, random, chance } from './Cool';

class Action {
	constructor(key, interval) {
		this.key = key;
		this.interval = interval * 10;
		this.count = 0;
		this.finished = false;
	}

	update(time) {
		if (this.count < this.interval) {
			this.count += time;
		} else {
			this.finished = true;
		}
		return !this.finished;
	}
}

export default function CharacterAIInput() {

	this.isAI = true;
	
	let actions = [];
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
		if (actions.every(a => a.finished) && isMoving) {
			// addActions();
		}

		for (let i = 0; i < actions.length; i++) {
			let active = actions[i].update(timeElapsed);
			keys[actions[i].key] = active;
		}
	};

	this.setKey = function(key, value) {
		keys[key] = value;
	};

	this.addAction = function(key, duration) {
		actions.push(new Action(key, duration));
	};

	// wait til char hits ground to move
	this.onHitGround = function() {
		if (!isMoving) {
			isMoving = true;
			keys.forward = true;
		}
	};

	this.onHitWall = function() {
		if (chance(0.5)) actions.push(new Action('jump', random(20, 40)));
	};


}