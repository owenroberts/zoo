import { LoopOnce } from 'three';
import { AnyState } from './AnyState';

class SinglePlayState extends AnyState {
	constructor(parent, name, returnState) {
		super(parent, name);
		this.returnState = returnState;
	}

	enter(prevState) {
		if (prevState.name == 'Run' || prevState.name == 'Walk') {
			this.returnState = prevState.name;
		}
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
		console.log('finished', this.returnState);
		this.parentStateMachine.set(this.returnState);
	}

	cleanup() {
		this.parentStateMachine.getAction(this.name).getMixer().removeEventListener('finished', this.finished);
	}

	exit() {
		this.cleanup();
	}
}

export { SinglePlayState };