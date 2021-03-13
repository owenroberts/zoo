import { LoopOnce } from 'three';
import { AnyState } from './AnyState';

class SinglePlayState extends AnyState {
	constructor(parent, name, returnState) {
		super(parent, name);
		this.returnState = returnState;
	}

	enter(prevState) {
		// if (prevState) console.log(prevState.name, this.name);
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
		if (this.returnState) {
			this.parentStateMachine.set(this.returnState);
		}
	}

	cleanup() {
		this.parentStateMachine.getAction(this.name).getMixer().removeEventListener('finished', this.finished);
	}

	exit() {
		this.cleanup();
	}
}

export { SinglePlayState };