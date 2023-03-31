console.log("Battery component loaded");

function calculateBatWid(per) {
	const dec = parseFloat(per) / 100;
	const num = dec * 100;
	const numNonPol = num * 2;
	const life = numNonPol + 10;
	return life;
}

function batToNum(life) {
	const dec = parseFloat(life) / 100;
	const num = dec * 100;
	return num;
}

if (navigator.getBattery)
	navigator.getBattery().then(battery => {
		const bar = document.getElementById("os-battery-bar");

		try {
      var charging = battery.charging;

      battery.onchargingchange = function(e) {
        charging = battery.charging;
      }
      
			addEventListener("DOMContentLoaded", event => {
				if (batToNum(xen.system.battery()) < 10 && !charging) {
					bar.style.width = calculateBatWid(xen.system.battery());
					bar.style.fill = "#ff4040";

					xen.notification.dispatch(
						"Low Battery",
						"The device's battery is running low.",
						"lowbat"
					);
				} else {
					bar.style.width = calculateBatWid(xen.system.battery());
					bar.style.fill = "#fff";
				}

				battery.onlevelchange = event => {
					if (batToNum(xen.system.battery()) < 15 && !charging) {
						bar.style.width = calculateBatWid(xen.system.battery());
						bar.style.fill = "#ff4040";
						xen.notification.dispatch(
							"Low Battery",
							"Your devices battery is running low.",
							"lowbat"
						);
					} else {
						bar.style.width = calculateBatWid(xen.system.battery());
						bar.style.fill = "#fff";
					}
				};
			});

			xen.system.battery = () => `${battery.level * 100}%`;
      xen.system.charging = () => battery.charging;
		} catch (err) {
			console.error(
				"An error occured while trying to get battery readings: \n" +
					err
			);
			bar.style.fill = "#ff4040";
		}
		if (battery.dischargingTime == Infinity) {
			const bar = document.getElementsByClassName('os-battery-container')[0];
			bar.remove();
		}
	});
else {
	// Remove icon
	const bar = document.getElementById("os-battery-bar");
	bar.remove();
}
