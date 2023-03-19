Object.defineProperty(window, "xen", {
	value: {},
	enumerable: false,
});

var listeners = [];

xen.parent = {
	send(message, ...data) {
		window.top.postMessage({ message, data: data });
	},
	on(event, cb) {
		listeners.push([event, cb]);
	},
};

listeners.push([
	"__XEN_LISTENER_CONNECTION_MANAGER",
	function (type, ...args) {
		if (type == "executeJS") return window.eval(args[0]);
	},
]);

window.addEventListener("message", function (data) {
	listeners
		.filter(e => e[0] == data.data.message)
		.forEach(e => e[1](...data.data.data));
});
