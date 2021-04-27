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

		// if not actions, chance to add an action
		if (Object.keys(actions).length == 0 && chance(0.01)) {
			this.addAction('forward', random(5, 20));
			if (chance(0.5)) this.addAction(chance(0.5) ? 'left' : 'right', random(5, 10));
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