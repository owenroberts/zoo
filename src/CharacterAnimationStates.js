import { AnyState } from './AnyState'
import { SinglePlayState } from './SinglePlayState';
import { choice } from './Cool';

class IdleState extends AnyState {
	update(_, input) {
		if (input.jump) {
			this.parentStateMachine.set('Jump');
		} else if (input.backward) {
			this.parentStateMachine.set('Back');
		} else if (input.forward || input.left || input.right) {
			this.parentStateMachine.set('Walk');
		} 
	}
}


class JumpState extends SinglePlayState {
	constructor(parent, name) {
		super(parent, name, choice('Idle1', 'Idle2'));
	}

	// update(_, input) {
	// 	if (input.backward) {
	// 		this.parentStateMachine.set('Back');
	// 	} else if (input.forward || input.left || input.right) {
	// 		this.parentStateMachine.set('Walk');
	// 	}
	// }
}

class WalkState extends AnyState {
	constructor(parent, name) {
		super(parent, name, ['Run', 'Back']);
	}

	update(time, input) {
		if (input.jump) {
			this.parentStateMachine.set('Jump');
			return;
		}
		if (input.forward || input.left || input.right) {
			if (input.run) {
				this.parentStateMachine.set('Run');
			}
			return;
		}
		this.parentStateMachine.set(choice('Idle1', 'Idle2'));
	}
}

class BackState extends AnyState {
	constructor(parent, name) {
		super(parent, name, ['Walk']);
	}

	update(time, input) {
		if (input.backward || input.left || input.right) {
			return;
		}
		this.parentStateMachine.set(choice('Idle1', 'Idle2'));
	}
}

class RunState extends AnyState {
	constructor(parent, name) {
		super(parent, name, ['Walk']);
	}

	update(time, input) {
		if (input.jump) {
			this.parentStateMachine.set('Jump');
			return;
		}
		if (input.forward || input.left || input.right) {
			if (!input.run) {
				this.parentStateMachine.set('Walk');
			}
			return;
		}
		this.parentStateMachine.set(choice('Idle1', 'Idle2'));
	}
}

export { IdleState, JumpState, WalkState, BackState, RunState };