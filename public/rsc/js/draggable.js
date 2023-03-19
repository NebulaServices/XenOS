const headerBar = document.getElementById("os-header");
let rect = headerBar.getBoundingClientRect();

document.addEventListener("mousemove", function (e) {
	const dragBoxes = document.querySelectorAll(".box-header-title");
	dragBoxes.forEach(function (dBox) {
		dBox.addEventListener("mousedown", function (e) {
			if (
				e.clientX < rect.left ||
				e.clientX > rect.right ||
				e.clientY < rect.top ||
				e.clientY > rect.bottom
			) {
			} else {
				const activeWindowName = xen.windowManager.activeWindow.active;
				if (activeWindowName == "null") {
					console.log("No Active Window Selected");
				} else {
					try {
						const activeWindow =
							document.getElementById(activeWindowName);
						activeWindow.style.top = "30px";

						// Don't drag
						e.preventDefault();
						e.stopPropagation();
					} catch (err) {
						console.log(err);
					}
				}
			}
		});
	});
});
