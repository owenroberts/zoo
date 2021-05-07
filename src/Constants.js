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
	aiNum: 12,

	// textures
	// buildingTexturePath: `./static/textures/pixels/building-${choice(1,2,3,4,5,6)}.png`,
	buildingTexturePath: './static/textures/real/building-light.jpg',
	// letterTexturePath: `./static/textures/pixels/n${choice(1,2,3,4,5,6,7,8,9)}.png`,
	letterTexturePath: './static/textures/real/stone-light.jpg',
	treeTexturePath: './static/textures/pixels/tree.png',
	grassTexturePath: './static/textures/blur/grass.png',
	groundTexturePath: `./static/textures/blur/ground-${choice(1,2,3,4,5)}.png`,
	characterTexturePath: () => {
		return `./static/textures/pixels/character-${choice(1,2,3,4,5)}.png`;
	},

	// models
	models: {
		letters: {
			path: './static/models/letters-2-low/',
			str: 'abcdefghijklmnopqrstuvwxyz',
			filename: '',
			instance: true,
			texturePath: './static/textures/real/stone-light.jpg',
			repeat: 4,
			color: 0x6f6c82,
			shadow: [true, true],
		},
		characters: {
			path: './static/models/characters/',
			str: 'ab',
			filename: 'zo',
			instance: false,
		},
		buildings: {
			path: './static/models/big-buildings/',
			str: 'abcdefg',
			filename: 'building-',
			instance: true,
			texturePath: './static/textures/real/building-light.jpg',
			repeat: 16,
			color: 0xb6d1fc,
			shadow: [true, false],
		},
		trees: {
			path: './static/models/trees-2/',
			str: 'abcdef',
			filename: 'tree-',
			instance: false,
		},
		grass: {
			path: './static/models/grass/',
			str: 'abcdefgh',
			filename: 'grass-',
			instance: false,
		},
		cross: {
			path: './static/models/walls/',
			str: 'abcdef',
			filename: 'cross-',
			instance: false,
		},
		post: {
			path: './static/models/walls/',
			str: 'abcd',
			filename: 'post-',
			instance: false,
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