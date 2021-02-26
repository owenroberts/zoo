import { State } from './FiniteStateMachine';

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

export { AnyState };