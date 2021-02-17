class FiniteStateMachine {
	constructor() {
		this._states = {};
		this._current = null;
	}

	add(name, type) {
		this._states[name] = type;
	}

	set(name) {
		const prev = this._current;
		if (prev) {
			if (prev.name == name) {
				return;
			}
			prev.exit();
		}

		const state = new this._states[name](this, name);
		this._current = state;
		state.enter(prev);
	}

	update(timeElapsed, input) {
		if (this._current) {
			this._current.update(timeElapsed, input);
		}
	}
}

class State {
	constructor(stateMachine, name, transitionStates) {
		this.parentStateMachine = stateMachine;
		this.name = name;
	}

	enter() {}
	exit() {}
	update() {}
};

export { FiniteStateMachine, State };