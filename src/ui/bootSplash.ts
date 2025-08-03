export function bootSplash() {
    const splash = document.createElement("div");
    splash.id = "boot-splash";
    splash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: var(--mocha-mantle);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: var(--mocha-text);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 9999;
        transition: opacity 0.4s ease-out;
    `;

    const logo = document.createElement("img");
    logo.src = "/assets/logo.svg";
    logo.alt = "XenOS Logo";
    logo.style.cssText = `
        width: 150px;
        height: 150px;
        margin-bottom: 20px;
    `;
    splash.appendChild(logo);

    const title = document.createElement("h1");
    title.textContent = "XenOS";
    title.style.cssText = `
        font-size: 3em;
        margin: 0;
        color: var(--mocha-text);
    `;
    splash.appendChild(title);

    const subtext = document.createElement("p");
    subtext.textContent = "Loading...";
    subtext.style.cssText = `
        font-size: 1.2em;
        margin-top: 10px;
        color: var(--mocha-subtext0);
    `;
    splash.appendChild(subtext);

    /*
    const loadingBarContainer = document.createElement("div");
    loadingBarContainer.style.cssText = `
        width: 300px;
        height: 8px;
        background-color: var(--mocha-surface0);
        border-radius: 4px;
        margin-top: 30px;
        overflow: hidden;
    `;
    splash.appendChild(loadingBarContainer);

    const loadingBar = document.createElement("div");
    loadingBar.id = "loading-bar";
    loadingBar.style.cssText = `
        width: 0%;
        height: 100%;
        background-color: var(--mocha-blue);
        border-radius: 4px;
        animation: loading-animation 0.2s infinite constant;
    `;
    loadingBarContainer.appendChild(loadingBar);
    */

    const style = document.createElement("style");
    style.textContent = `
        @keyframes loading-animation {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(splash);
    return splash;
}