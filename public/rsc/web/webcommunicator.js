Object.defineProperty(window, "xen", {
	value: {},
	enumerable: false,
});

// Execute JS from Xen
var listeners = [];
listeners.push([
	"__XEN_LISTENER_CONNECTION_MANAGER",
	(type, ...args) => {
		if (type === "executeJS") return eval(args[0]);
	},
]);
window.addEventListener("message", data => {
	listeners
		.filter(listener => listener[0] === data.data.message)
		.forEach(e => e[1](...data.data.data));
});
