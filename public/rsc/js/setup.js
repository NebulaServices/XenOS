// TODO: Cease use of setTimeout

const setupText = document.getElementById("SetupText");
const Wrap = document.getElementById("SetupWrapper");
const pwButtonWrap = document.getElementById("passWordButtonChoice");
const pwInput = document.getElementById("passWordInput");
const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const keyBindMenu = document.getElementById("keybinds");
const finalButton = document.getElementById("doneButtonFinal");

const setupStatus = localStorage.getItem("setup_status");

// Cryptography
var CryptoJS = require("crypto-js");

function set(key, val) {
	localStorage.setItem(key, val);
}
function step1() {
	setupText.innerHTML = "Please wait while we initialize your profile";
	set("profile_name", "Profile1");
	set("active_profile", "Profile1");
	set("profile_password", "xen_password");
}
function step2() {
	setupText.innerHTML =
		"Thanks for waiting. Would you like to choose a password?";
	setupText.style.animation = "none";
	pwButtonWrap.style.display = "block";
}

function pwOption(status) {
	if (status === "yes") {
		localStorage.setItem("passwordSet", "true");
		localStorage.setItem("XSKEY", Math.floor(Math.random() * 10) * 300);
		const key = localStorage.getItem("XSKEY");
		noButton.style.display = "none";
		yesButton.style.display = "none";
		pwInput = document.getElementById("passWordInput");
		pwInput.style.display = "block";
		const pwFinal = pwInput.value;

		pwInput.addEventListener("keyup", e => {
			console.log(pwFinal);

			if (e.key == "Enter") {
				// dont touch
				var ciphertext = CryptoJS.AES.encrypt(
					`${document.getElementById("passWordInput").value}`,
					key
				).toString();
				localStorage.setItem("_SXenPass", ciphertext);
				pwInput.style.display = "none"; // what do i work on
				// finish the start menu or work on getting the appstore working
				step3();
				setTimeout(() => {
					step4();
				}, 4900);
			}
		});
	} else {
		noButton.style.display = "none";
		yesButton.style.display = "none";
	}
}
function step3() {
	setupText.innerHTML = "Great!";
	setupText.style = "";
}
async function step4() {
	setupText.innerHTML = "Congrats and Welcome <3 ";
	setupText.style.animation = "none";
	setTimeout(() => {
		keyBindMenu.style = `display: flex;animation: 0s ease 0s 1 normal none running none;align-items: center;justify-content: center; align-content: center; flex-wrap: nowrap;flex-direction: column;`;
	}, 1000);
	finalButton.onclick = () => {
		keyBindMenu.style = "";
		finalButton.style.display = "none";
		setupText.innerHTML = "Perfect. Welcome to XenOS!";
		setTimeout(() => {
			Wrap.style.opacity = "0";

			setTimeout(() => {
				Wrap.style.display = "none";
				localStorage.setItem("setup_status", "done");
			}, 1000);
		}, 1000);
	};
}

if (setupStatus == null) {
	Wrap.style = "";
	// needs to setup lol
	setTimeout(() => {
		step1();
	}, 6700);
	setTimeout(() => {
		step2();
		yesButton.onclick = () => {
			pwOption("yes");
		};
		noButton.onclick = () => {
			pwOption("no");
			step3();
			setTimeout(() => {
				step4();
			}, 4900);
		};
	}, 15500);
}
