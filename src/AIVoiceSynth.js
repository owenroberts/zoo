/*
	ai voices
*/

import { choice, random, chance } from './Cool';

export default function VoiceSynth() {
	const voiceSynth = window.speechSynthesis;
	let voices;
	const voiceLoaded = setInterval(() => {
		if (voiceSynth.getVoices().length > 0) {
			voices = voiceSynth.getVoices();
			clearInterval(voiceLoaded);
		}
	}, 25);

	const vowels = 'aeiou';
	const consonants = 'bcdfghjklmnpqrstvwxyz';

	this.speak = function(message) {
		if (!voiceSynth) return;
		const m = message.split('').map(l => {
			return vowels.includes(l) ? l : choice(...consonants);
		}).join('');
		const utterance = new SpeechSynthesisUtterance(m);
		utterance.voice = choice(...voices);
		voiceSynth.speak(utterance);
	};
}