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
		talk: false,
		sniff: false,
	};

	for (const key in keys) {
		Object.defineProperty(this, key, {
			get: function() {
				return keys[key];
			},
			set: function(value) {
				keys[key] = value;
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
		for (const key in actions) {
			let action = actions[key];
			action.count += timeElapsed;
			if (action.count > action.delay && 
				action.count < action.delay + action.interval &&
				!keys[key]) {
				keys[key] = true;
				if (action.callback) action.callback();
			}
			if (action.count > action.interval + action.delay) {
				keys[key] = false;
				delete actions[key];
			}
		}
	};


	// if has action with delay
	this.hasAction = function(key) {
		return actions[key];
	};

	this.addAction = function(key, duration, delay, callback) {
		if (isMoving) {
			actions[key] = {
				count: 0,
				interval: duration * 100,
				delay: delay * 100 || 0,
				callback: callback
			};
		}
	};

	this.killActions = function() {
		actions = {};
		for (const key in keys) {
			keys[key] = false;
		}
	};

	// wait til char hits ground to move
	this.onHitGround = function() {
		if (!isMoving) isMoving = true;
	};

	this.onHitWall = function() {
		if (chance(0.5)) this.addAction('jump', 1);
	};

}