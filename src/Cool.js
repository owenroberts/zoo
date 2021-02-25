/* some utils */

function choice(...choices) {
	return choices[Math.floor(Math.random() * choices.length)];
}

export { choice };