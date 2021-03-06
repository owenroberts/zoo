class FiniteStateMachine {
	constructor() {
		this.states = {};
		this.current = null;
		this.debug = false;
	}

	add(name, type) {
		this.states[name] = type;
	}

	set(name) {
		// if (this.debug) console.log('new state', name, 'prev state', this.current.name);
		const prev = this.current;
		if (prev) {
			if (prev.name == name) {
				return;
			}
			prev.exit();
		}

		const state = new this.states[name](this, name);
		this.current = state;
		state.enter(prev);
	}

	update(...args) {
		if (this.current) {
			this.current.update(...args);
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