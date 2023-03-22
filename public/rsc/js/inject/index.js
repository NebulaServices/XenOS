Object.defineProperty(window, "xen", {
	value: {},
	enumerable: false,
});

var modules = {
  path: require('path-browserify'),
}

var listeners = [];

xen.parent = {
	send(message, ...data) {
		window.top.postMessage({ message, data: data });
	},
	on(event, cb) {
		listeners.push([event, cb]);
	},
};

xen.modules = {};

listeners.push([
	"__XEN_LISTENER_CONNECTION_MANAGER",
	function (type, ...args) {
    console.log(type);
		if (type == "executeJS") return window.eval(args[0]);
	},
]);

listeners.push([
  '__XEN_MODULE_CONNECTION',
  function({ name }) {
    console.log(name);
    xen.modules[name] = modules[name];
  }
])

window.addEventListener("message", function (data) {
  console.log(data);
	listeners
		.filter(e => e[0] == data.data.message)
		.forEach(e => e[1](...data.data.data));
});
