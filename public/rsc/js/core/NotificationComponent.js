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
				new Function(`this.style.display='none';this.remove();`);
			notiWrap.appendChild(iconWrap);
			iconWrap.classList.add("os-notification-icon");
			if (icon == "lowbat")
				iconWrap.innerHTML = `<object data="/rsc/img/icons/lowbat.svg" width="447" height="112" type="image/svg+xml"></object>`;
			else
				iconWrap.innerHTML = `<img src='https://xenos-dev.greenworldia.repl.co/media?imageUrl=https://media.discordapp.net/attachments/1062938122666639360/1075175423631163402/XOS.png' style='    width: 47px;
    height: 53px;
    position: absolute;
    top: -17px;
    left: 6px;
    border-radius: 13px;'>`;

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
		el.style.display = "none";
	}
};
