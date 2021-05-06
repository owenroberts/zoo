/*
	display dialog
*/

export default function DialogDisplay(w, h) {

	// lines used to render dialog -- maybe just use text -- cool css animations??
	const lines = new Game({
		dps: 24,
		width: w,
		height: h,
		scenes: ['dialog'],
		lineWidth: 2,
	});

	lines.load({
		text: 'static/drawings/data.json'
	});

	let dialog;

	window.start = function() {
		let indexString = "abcdefghijklmnopqrstuvwxyz.?',";
		dialog = new Text(100, h - 200, 'welcome to hell', 32, lines.anims.text.lettering, indexString);
	};

	// uses its own draw update -- combine with animate -- maybe better to have separate
	window.draw = function() {
		let isFinished = dialog.display(true, true);
		if (isFinished && dialog.isActive) dialog.isActive = false;
	};

	this.setMessage = function(message) {
		dialog.setMsg(message);
		dialog.isActive = true;
	};

	this.isActive = function() {
		return dialog.isActive;
	};
}