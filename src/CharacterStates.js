import { LoopOnce } from 'three';
import { FiniteStateMachine, State } from './FiniteStateMachine';
import { choice } from './Cool';

class CharacterFSM extends FiniteStateMachine {
	constructor(animations) {
		super();
		this.animations = animations;
		this.add('Idle1', IdleState);
		this.add('Idle2', IdleState);
		this.add('Walk', WalkState);
		this.add('Back', BackState);
		this.add('Run', RunState);
		this.add('Jump', JumpState);
		// this.add('dance', DanceState);
	}

	getAction(state) {
		return this.animations[state].action;
	}
}

class AnyState extends State {
	constructor(parent, name, transitionStates) {
		super(parent, name);
		this.transitionStates = transitionStates || [];
	}

	enter(prevState, callback) {
		const currentAction = this.parentStateMachine.getAction(this.name);
		if (prevState) {
			const prevAction = this.parentStateMachine.getAction(prevState.name);
			if (this.transitionStates.includes(prevState.name)) {
				const ratio = currentAction.getClip().duration / prevAction.getClip().duration;
				currentAction.time = prevAction.time * ratio;
			} else {
				currentAction.time = 0.0;
			}
			currentAction.enabled = true;
			currentAction.setEffectiveTimeScale(1.0);
			currentAction.setEffectiveWeight(1.0);
			currentAction.crossFadeFrom(prevAction, 0.5, true);
		}
		currentAction.play();
	}
}

class SinglePlayState extends AnyState {
	constructor(parent, name, returnState) {
		super(parent, name);
		this.returnState = returnState;
	}

	enter(prevState) {
		const currentAction = this.parentStateMachine.getAction(this.name);
		const mixer = currentAction.getMixer();
		mixer.addEventListener('finished', () => {
			this.finished();
		});
		currentAction.reset();
		currentAction.setLoop(LoopOnce, 1);
		currentAction.clampWhenFinished = true;
		super.enter(prevState);
	}

	finished() {
		this.cleanup();
		this.parentStateMachine.set(this.returnState);
	}

	cleanup() {
		this.parentStateMachine.getAction(this.name).getMixer().removeEventListener('finished', this.finished);
	}

	exit() {
		this.cleanup();
	}
}

class IdleState extends AnyState {
	update(_, input) {
		if (input.backward) {
			this.parentStateMachine.set('Back');
		} else if (input.forward || input.left || input.right) {
			this.parentStateMachine.set('Walk');
		} else if (input.space) {
			this.parentStateMachine.set('Jump');
		}
	}
}

class DanceState extends SinglePlayState {
	constructor(parent, name) {
		super(parent, name, choice('Idle1', 'Idle2'));
	}

	update(_, input) {
		if (input.backward) {
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

	update(_, input) {
		if (input.backward) {
			this.parentStateMachine.set('Back');
		} else if (input.forward || input.left || input.right) {
			this.parentStateMachine.set('Walk');
		}
	}
}

class WalkState extends AnyState {
	constructor(parent, name) {
		super(parent, name, ['Run', 'Back']);
	}

	update(time, input) {
		if (input.forward || input.left || input.right) {
			if (input.shift) {
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
		if (input.forward || input.left || input.right) {
			if (!input.shift) {
				this.parentStateMachine.set('Walk');
			}
			return;
		}
		this.parentStateMachine.set(choice('Idle1', 'Idle2'));
	}
}

export { CharacterFSM };