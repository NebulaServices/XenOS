window.__XEN_WEBPACK.core.NotificationComponent = class NotificationComponent {
	constructor() {
		this.notifications = {};
	}

	dispatch(name, description, icon) {
		const check = document.getElementById(name);

		if (check == null || check == undefined || check == "undefined") {
			const master = document.getElementById("os-desktop");
			const notiWrap = document.createElement("div");
			const iconWrap = document.createElement("div");
			const notiTitle = document.createElement("div");
			const notiDescription = document.createElement("div");
			master.appendChild(notiWrap);
			notiWrap.classList.add("os-notification-1");
			notiWrap.id = name;
			notiWrap.ondblclick=
				new Function(`xen.notification.retract(this.id)`);
			notiWrap.appendChild(iconWrap);
			iconWrap.classList.add("os-notification-icon");
			if (icon == "lowbat")
				iconWrap.innerHTML = `<object data="/rsc/img/icons/lowbat.svg" width="447" height="112" type="image/svg+xml"></object>`;
			else
				iconWrap.innerHTML = `<img src='${icon}' style='height: 56px;
    position: absolute;
    top: -18px;
    left: 6px;
    border-radius: 13px;
    box-shadow: -6px 3px 72px -4px rgba(0,0,0,0.53);
    -webkit-box-shadow: -6px 3px 72px -4px rgba(0,0,0,0.53);
    -moz-box-shadow: -6px 3px 72px -4px rgba(0,0,0,0.53);'>`;

			notiWrap.appendChild(notiTitle);
			notiTitle.innerText = name;
			notiTitle.classList.add("os-notification-title");

			notiWrap.appendChild(notiDescription);
			notiDescription.innerText = description;
			notiDescription.classList.add("os-notification-description");
		} else if (
			check !== null ||
			check !== undefined ||
			check !== "undefined"
		) {
			throw new TypeError(
				"Error while Dispatching: \n A notification with that name already exists."
			);
		}
	}
	retract(name) {
		let el = document.getElementById(name);
    el.style = 'animation: delNotif 1s ease 0s 1 normal forwards;'
    setTimeout(function(){
        el.remove()
    }, 1000)
	 
	}
};
