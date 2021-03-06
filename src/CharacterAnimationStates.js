/*
	states for each character animation in FSM
*/

import { AnyState } from './AnyState'
import { SinglePlayState } from './SinglePlayState';
import { choice } from './Cool';

class IdleState extends AnyState {
	update(input, jump) {
		if (jump.started) {
			this.parentStateMachine.set('JumpStart');
			return;
		}

		if (input.talk) {
			this.parentStateMachine.set('Talk');
			return;
		}

		if (input.sniff) {
			this.parentStateMachine.set('Sniff');
			return;
		}

		if (input.backward) {
			this.parentStateMachine.set('Back');
			return;
		}

		if (input.forward || input.left || input.right) {
			this.parentStateMachine.set('Walk');
		} 
	}
}

class JumpStart extends SinglePlayState {
	constructor(parent, name) {
		super(parent, name);
	}

	update(input, jump) {
		if (!input.jump) {
			this.parentStateMachine.set('JumpMid');
		}
	}
}

class JumpMid extends AnyState {
	constructor(parent, name) {
		super(parent, name, );
	}

	update(input, jump, endOfJump) {
		if (endOfJump || jump.count == 0) {
			this.parentStateMachine.set('JumpLand');
		}
	}
}

class JumpLand extends SinglePlayState {
	constructor(parent, name) {
		super(parent, name);
	}
	update(input, jump, endOfJump) {
		if (jump.count > 0 && !endOfJump) {
			this.parentStateMachine.set('JumpMid');
			return;
		}
		if (jump.count === 0) {
			this.parentStateMachine.set('Idle1');
		}
	}
}

class WalkState extends AnyState {
	constructor(parent, name) {
		super(parent, name, ['Run', 'Back']);
	}

	update(input, jump) {
		if (jump.started) {
			this.parentStateMachine.set('JumpStart');
			return;
		}

		if (input.talk) {
			this.parentStateMachine.set('Talk');
			return;
		}

		if (input.sniff) {
			this.parentStateMachine.set('Sniff');
			return;
		}

		if (input.forward || input.left || input.right) {
			if (input.run) this.parentStateMachine.set('Run');
			return;
		}

		this.parentStateMachine.set(choice('Idle1', 'Idle2'));
	}
}

class BackState extends AnyState {
	constructor(parent, name) {
		super(parent, name, ['Walk']);
	}

	update(input, jump) {
		if (jump.started) {
			this.parentStateMachine.set('JumpStart');
			return;
		}

		if (input.talk) {
			this.parentStateMachine.set('Talk');
			return;
		}

		if (input.sniff) {
			this.parentStateMachine.set('Sniff');
			return;
		}

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

	update(input, jump) {
		if (jump.started) {
			this.parentStateMachine.set('JumpStart');
			return;
		}

		if (input.talk) {
			this.parentStateMachine.set('Talk');
			return;
		}

		if (input.sniff) {
			this.parentStateMachine.set('Sniff');
			return;
		}

		if (input.forward || input.left || input.right) {
			if (!input.run) this.parentStateMachine.set('Walk');
			return;
		}

		this.parentStateMachine.set(choice('Idle1', 'Idle2'));
	}
}

class TalkState extends AnyState {
	update(input) {
		// only return to idle when done talking
		if (!input.talk) {
			this.parentStateMachine.set(choice('Idle1', 'Idle2'));
		}
	}
}

class SniffState extends AnyState {
	update(input) {
		// only return to idle when done talking
		if (!input.sniff) {
			this.parentStateMachine.set(choice('Idle1', 'Idle2'));
		}
	}
}


export { IdleState, JumpStart, JumpMid, JumpLand, WalkState, BackState, RunState, TalkState, SniffState };
