function CharacterControllerInput() {
	
	const keys = {
		forward: false,
		backward: false,
		left: false,
		right: false,
		space: false,
		shift: false,
	};

	for (const key in keys) {
		Object.defineProperty(this, key, {
			get: function() {
				return keys[key]
			}
		});
	};

	document.addEventListener('keydown', ev => onKey(ev, true), false);
	document.addEventListener('keyup', ev => onKey(ev, false), false);

	function onKey(event, isDown) {
		switch (event.keyCode) {
			case 87: // w
				keys.forward = isDown;
				break;
			case 65: // a
				keys.left = isDown;
				break;
			case 83: // s
				keys.backward = isDown;
				break;
			case 68: // d
				keys.right = isDown;
				break;
			case 16: // shift
				keys.shift = isDown;
				break;
			case 32: // space
				keys.space = isDown;
				break;
			case 38: // up
			case 37: // left
			case 40: // down
			case 39: // right
				break;
		}
	}

}

export { CharacterControllerInput };