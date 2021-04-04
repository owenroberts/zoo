/* some utils */

function choice(...choices) {
	return choices[Math.floor(Math.random() * choices.length)];
}

function random(min, max) {
	if (!max) {
		if (typeof min === "number") {
			return Math.random() * (min);
		} else if (Array.isArray(min)) {
			return min[Math.floor(Math.random() * min.length)];
		} else if (typeof min == 'object') {
			return min[Cool.random(Object.keys(min))];
		}
	} else {
		return Math.random() * (max - min) + min;
	}
}

function map(value, low1, high1, low2, high2) {
	return low2 + (high2 - low2) * (value - low1) / (high1 - low1) || 0;
};

function chance(n) {
	return random(1) < n;
}

export { choice, random, map, chance };