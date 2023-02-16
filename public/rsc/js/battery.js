console.log("Battery component loaded");

function calculateBatWid(life) {
	// turn percent into an integer
	const _numDecimal = parseFloat(life) / 100;
	const batLifeNum = _numDecimal * 100;
	const batLife_nonPol = batLifeNum * 2;
	const batLife = batLife_nonPol + 10;
	return batLife;
}

function batToNum(life) {
	const _numDecimal = parseFloat(life) / 100;
	const batLifeNum = _numDecimal * 100;
	return batLifeNum;
}
navigator.getBattery().then(battery => {
	const bar = document.getElementById("os-battery-bar");
	const widget = document.getElementById("battery");
	try {
		addEventListener("DOMContentLoaded", event => {
			if (batToNum(xen.system.battery()) < 15) {
				bar.style.width = calculateBatWid(xen.system.battery());
				bar.style.fill = "#ff4040";
				xen.notification.dispatch(
					"Low Battery",
					"Your devices battery is running low.", "lowbat"
				);
			} else {
				bar.style.width = calculateBatWid(xen.system.battery());
				bar.style.fill = "#fff";
			}

			battery.onlevelchange = event => {
				if (batToNum(xen.system.battery()) < 15) {
					bar.style.width = calculateBatWid(xen.system.battery());
					bar.style.fill = "#ff4040";
					xen.notification.dispatch(
						"Low Battery",
						"Your devices battery is running low.", "lowbat"
					);
				} else {
					bar.style.width = calculateBatWid(xen.system.battery());
					bar.style.fill = "#fff";
				}
			};
		});
		batteryIsCharging = battery.charging;
		xen.system.battery = () => `${battery.level * 100}%`;
	} catch (e) {
		console.error(
			"An error occured while trying to get battery readings: \n" + e
		);
		bar.style.fill = "#ff4040";
	}
});
