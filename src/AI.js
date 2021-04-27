/*
	setup and manage ais
*/

import CharacterAIInput from './CharacterAIInput';
import CharacterAI from './CharacterAI';
import { CharacterController } from './CharacterController';
import { choice, random, chance } from './Cool';
import AIDialog from './AIDialog';

export default function AI(num, map, sideLength, scene, physics, modelLoader) {

	const AIs = [];
	const updateTimeMax = 1000 / 10; // dont allow long time updates
	const dialogs = AIDialog();

	const positions = [];
	const hexes = map.getHexes();

	for (let i = 0; i < num; i++) {
		let hex = hexes.splice(Math.floor(random(hexes.length)), 1)[0];
		positions.push(hex.calculatePosition(sideLength));
	}

	for (let i = 0; i < positions.length; i++) {
		const { x, y } = positions[i];
		const input = new CharacterAIInput();
		const position = [x, 8, y];
		const controller = new CharacterController(scene, physics, modelLoader, input, position);
		const dialog = dialogs.splice(Math.floor(random(dialogs.length)), 1)[0];
		AIs.push(new CharacterAI(input, controller, dialog));
	}

	this.update = function(timeElapsed, playerProps) {
		
		const props = [playerProps]; // collect basic position info of all ais
		
		for (let i = 0; i < AIs.length; i++) {
			props.push(AIs[i].controller.getProps());
		}

		for (let i = 0; i < AIs.length; i++) {
			AIs[i].update(Math.min(updateTimeMax, timeElapsed), props);
		}

		props.shift();
		return props; // return props to player for buff sniff action
	};
}