const appInitialize = (title, version, css) => {
	document.title = title;

	if (css) {
		const link = document.createElement('link');
		link.rel = "stylesheet";
		link.href = css + "?" + version;
		document.head.appendChild(link);
	}

	import("./app.js").then(module => {
		// console.log(module);
	});

	console.log(title + " Version: " + version);
}
appInitialize("Three", "0.0.0");
