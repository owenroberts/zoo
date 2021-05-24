/*
	ai voices
*/

import { choice, random, chance } from './Cool';

// voices to exclude (the singy ones) -- or ones that just read letters
const exclude = ['Princess', 'Cellos', 'Trinoids', 'Bells'];
const debug = false;

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
			if (" .?'".includes(l)) return l;
			return vowels.includes(l) ? l : choice(...consonants);
		}).join('');
		if (debug) console.log(m);
		const utterance = new SpeechSynthesisUtterance(m);
		const voice = choice(...voices);
		if (debug) console.log(voice);
		utterance.voice = voice;
		voiceSynth.speak(utterance);
	};
}