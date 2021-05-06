/*
	constants for scene size etc
*/

import { choice } from './Cool';

const constants = {

	alphabet: 'abcdefghijklmnopqrstuvwxyz', // i love the alphabet
	
	// map, world settings
	hexRings: 2,
	sideLength: 8,
	sceneWidth: 256,
	sceneDepth: 256,
	buildingSize: 48,
	buildingRows: 2,
	buildingY: 3,


	// ai settings
	aiNum: 20,

	// textures
	// buildingTexturePath: `./static/textures/pixels/building-${choice(1,2,3,4,5,6)}.png`,
	buildingTexturePath: './static/textures/real/building-light.jpg',
	// letterTexturePath: `./static/textures/pixels/n${choice(1,2,3,4,5,6,7,8,9)}.png`,
	letterTexturePath: './static/textures/real/stone-light.jpg',
	treeTexturePath: './static/textures/pixels/tree.png',
	grassTexturePath: './static/textures/blur/grass.png',
	groundTexturePath: `./static/textures/blur/ground-${choice(1,2,3,4,5)}.png`,

	// models
	models: {
		letters: {
			path: './static/models/letters-2-low/',
			str: 'abcdefghijklmnopqrstuvwxyz',
			filename: '',
		},
		characters: {
			path: './static/models/characters/',
			str: 'ab',
			filename: 'zo',
		},
		buildings: {
			path: './static/models/big-buildings/',
			str: 'abcdefg',
			filename: 'building-',
		},
		trees: {
			path: './static/models/trees-2/',
			str: 'abcdef',
			filename: 'tree-',
		},
		grass: {
			path: './static/models/grass/',
			str: 'abcdefgh',
			filename: 'grass-',
		},
	},

	// onboarding commands
	onBoarding: [
		'hit x to begin with sound,\n z to begin without sound',
		// 'click and drag the mouse to rotate the view, x to continue',
		// 'use the wasd keys to move, x to continue',
		// 'w is forward, s is backward, x to continue',
		// 'a is left, d is right, x to continue',
		// 'hold shift to run, x to continue',
		'you have five minutes to get out of the zoo before you starve to death, x to begin',
	],
};
export default constants;