import { LoopOnce } from 'three';
import { FiniteStateMachine, State } from './FiniteStateMachine';

class CharacterFSM extends FiniteStateMachine {
	constructor(animations) {
		super();
		this.animations = animations;
		this.add('idle', IdleState);
		this.add('walk', WalkState);
		this.add('back', BackState);
		this.add('run', RunState);
		this.add('dance', DanceState);
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
			this.parentStateMachine.set('back');
		} else if (input.forward || input.left || input.right) {
			this.parentStateMachine.set('walk');
		} else if (input.space) {
			this.parentStateMachine.set('dance');
		}
	}
}

class DanceState extends SinglePlayState {
	constructor(parent, name) {
		super(parent, name, 'idle');
	}
}

class WalkState extends AnyState {
	constructor(parent, name) {
		super(parent, name, ['run', 'back']);
	}

	update(time, input) {
		if (input.forward || input.left || input.right) {
			if (input.shift) {
				this.parentStateMachine.set('run');
			}
			return;
		}
		this.parentStateMachine.set('idle');
	}
}

class BackState extends AnyState {
	constructor(parent, name) {
		super(parent, name, ['walk']);
	}

	update(time, input) {
		if (input.backward || input.left || input.right) {
			return;
		}
		this.parentStateMachine.set('idle');
	}
}

class RunState extends AnyState {
	constructor(parent, name) {
		super(parent, name, ['walk']);
	}

	update(time, input) {
		if (input.forward || input.left || input.right) {
			if (!input.shift) {
				this.parentStateMachine.set('walk');
			}
			return;
		}
		this.parentStateMachine.set('idle');
	}
}

export { CharacterFSM };