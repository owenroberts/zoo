/*
	setup and manage ais
*/

import CharacterAIInput from './CharacterAIInput';
import CharacterAI from './CharacterAI';
import { CharacterController } from './CharacterController';
import { choice, random, chance } from './Cool';
import dialogs from './AIDialog';
import C from './Constants';

export default function AI(map, scene, physics, modelLoader) {

	let AIs = [];
	const updateTimeMax = 1000 / 20; // dont allow long time updates
	
	const hexes = map.getHexes();
	const positions = [];

	for (let i = 0; i < C.aiNum; i++) {
		const hex = choice(...hexes);
		const { x, y } = hex.calculatePosition(C.sideLength);
		const position = [x, 8, y];
		position[0] += choice(-3, 3);
		position[2] += choice(-3, 3);
		while (positions.filter(pos => pos[0] == position[0] && pos[2] == position[2]).length > 1) {
			position[0] += choice(-3, 3);
			position[2] += choice(-3, 3);
		}
		positions.push(position);

		const input = new CharacterAIInput();
		const controller = new CharacterController(scene, physics, modelLoader, input, position);
		const dialog = dialogs.splice(Math.floor(random(dialogs.length)), 1)[0];
		AIs.push(new CharacterAI(input, controller, dialog));
	}

	this.update = function(timeElapsed, playerProps) {
		
		const props = [playerProps]; // collect basic position info of all ais
		
		for (let i = 0; i < AIs.length; i++) {
			props.push(AIs[i].controller.getProps());
		}

		let canTalk = true;
		for (let i = 0; i < AIs.length; i++) {
			let didTalk = AIs[i].update(Math.min(updateTimeMax, timeElapsed), props, canTalk);
			canTalk = !didTalk;
		}

		props.shift();
		return props; // return props to player for buff sniff action
	};

	this.reset = function() {
		for (let i = 0; i < AIs.length; i++) {
			AIs[i].controller.remove();
		}
		AIs = [];
	};
}