import { FiniteStateMachine } from './FiniteStateMachine';
import { IdleState, JumpState, WalkState, BackState, RunState } from './CharacterAnimationStates';

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

export { CharacterFSM };