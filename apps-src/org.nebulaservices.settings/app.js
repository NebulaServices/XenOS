function main() {
    const wispIn = document.getElementById("wisp-url");
    const saveWispBtn = document.getElementById("save-wisp-url");
    const updateBtn = document.getElementById("check-updates");
    const resetBtn = document.getElementById("reset-instance");

    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".section");

    const policyPath = document.getElementById("current-policy-path");
    const navBack = document.getElementById("nav-back");
    const createPolicyBtn = document.getElementById("create-policy-btn");
    const policyList = document.getElementById("policy-list");
    const policyContent = document.getElementById("policy-content");
    const savePolicyBtn = document.getElementById("save-policy-btn");
    const rmPolicy = document.getElementById("delete-policy-btn");

    const POLICY_ROOT = "/usr/policies/";
    let currentPolicy = POLICY_ROOT;
    let selectedPath = null;
    let isPolicyFile = false;

    const currentWpImg = document.getElementById("current-wallpaper-img");
    const wpGallery = document.getElementById("wallpaper-gallery");
    const galleryEmptyMsg = document.getElementById("gallery-empty-message");
    const uploadWpFileBtn = document.getElementById("upload-wallpaper-file");
    const uploadWpUrlBtn = document.getElementById("upload-wallpaper-url");
    const uploadWpFsBtn = document.getElementById("upload-wallpaper-fs");
    const rmWpBtn = document.getElementById("remove-wallpaper");

    function resetPolicyEditor() {
        selectedPath = null;
        isPolicyFile = false;
        policyContent.value = "";
        policyContent.disabled = true;
        savePolicyBtn.disabled = true;
        rmPolicy.disabled = true;
    }

    async function loadPolicies(path) {
        policyList.innerHTML = '<p class="wip-message">Loading policies...</p>';
        policyPath.value = path;
        resetPolicyEditor();

        navBack.disabled = path === POLICY_ROOT;

        try {
            const exists = await parent.xen.fs.exists(path);
            if (!exists) {
                await parent.xen.fs.mkdir(path);
            }

            let entries = await parent.xen.fs.list(path);
            policyList.innerHTML = "";

            if (entries.length === 0 && path === POLICY_ROOT) {
                try {
                    await parent.xen.policy.getPolicy("global");
                    await parent.xen.policy.getPolicy("network");
                    entries = await parent.xen.fs.list(path);
                } catch (e) {
                    parent.xen.notifications.spawn({
                        title: "XenOS Policy",
                        description: `Failed to create default policies: ${e.message}`,
                        icon: `/assets/logo.svg`,
                        timeout: 5000,
                    });
                }
            }

            if (entries.length === 0) {
                policyList.innerHTML = '<p class="wip-message">This folder is empty</p>';
                return;
            }

            const filteredEntries = entries.filter((e) => {
                if (path === POLICY_ROOT) {
                    return e.isDirectory;
                }
                return e.isDirectory || (e.isFile && e.name.endsWith(".json"));
            });

            if (filteredEntries.length === 0) {
                policyList.innerHTML =
                    '<p class="wip-message">No policies found in this folder</p>';
                return;
            }

            filteredEntries.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            filteredEntries.forEach((entry) => {
                const isDir = entry.isDirectory;
                const isFile = entry.isFile;
                const entryPath = `${path}${entry.name}`;

                const itemDiv = document.createElement("div");
                itemDiv.classList.add("policy-list-item");
                itemDiv.dataset.path = entryPath;
                itemDiv.dataset.isDirectory = isDir.toString();
                itemDiv.dataset.isFile = isFile.toString();

                const icon = document.createElement("i");
                icon.classList.add("fas", isDir ? "fa-folder" : "fa-file-alt");

                if (isDir) {
                    itemDiv.classList.add("folder");
                }

                const span = document.createElement("span");
                span.textContent = entry.name;

                itemDiv.append(icon, span);
                policyList.appendChild(itemDiv);

                itemDiv.addEventListener("click", async () => {
                    document
                        .querySelectorAll(".policy-list-item")
                        .forEach((el) => el.classList.remove("selected"));
                    itemDiv.classList.add("selected");

                    resetPolicyEditor();

                    selectedPath = entryPath;
                    rmPolicy.disabled = false;

                    if (isDir) {
                        currentPolicy = `${entryPath}/`;
                        await loadPolicies(currentPolicy);
                    } else {
                        isPolicyFile = true;
                        policyContent.disabled = false;
                        savePolicyBtn.disabled = false;

                        try {
                            const content = await parent.xen.fs.read(selectedPath, "text");
                            try {
                                policyContent.value = JSON.stringify(
                                    JSON.parse(content),
                                    null,
                                    4,
                                );
                            } catch (e) {
                                policyContent.value = content;
                                parent.xen.notifications.spawn({
                                    title: "XenOS Policy",
                                    description: `Warning: ${entry.name} is not valid JSON`,
                                    icon: `/assets/logo.svg`,
                                    timeout: 3000,
                                });
                            }
                        } catch (e) {
                            policyContent.value = `Error reading file: ${e.message}`;
                            parent.xen.notifications.spawn({
                                title: "XenOS Policy",
                                description: `Failed to read ${entry.name}: ${e.message}`,
                                icon: `/assets/logo.svg`,
                                timeout: 3000,
                            });
                        }
                    }
                });
            });
        } catch (e) {
            policyList.innerHTML = `<p class="wip-message">Failed to load policies: ${e.message}</p>`;
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: `Failed to directory: ${e.message}`,
                icon: `/assets/logo.svg`,
                timeout: 3000,
            });
        }
    }

    async function savePolicy() {
        if (!selectedPath || !isPolicyFile) {
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: "No policy file selected",
                icon: `/assets/logo.svg`,
                timeout: 2500,
            });
            return;
        }

        try {
            const content = JSON.stringify(
                JSON.parse(policyContent.value),
                null,
                2,
            );
            await parent.xen.fs.write(selectedPath, content);
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: "Policy saved successfully!",
                icon: `/assets/logo.svg`,
                timeout: 2500,
            });
        } catch (e) {
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: `Failed to save policy: ${e.message}`,
                icon: `/assets/logo.svg`,
                timeout: 4000,
            });
        }
    }

    async function deletePolicy() {
        if (!selectedPath) {
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: "No file/folder selected",
                icon: `/assets/logo.svg`,
                timeout: 2500,
            });
            return;
        }

        const selectedEl = policyList.querySelector(
            `.policy-list-item[data-path="${selectedPath}"]`,
        );
        if (!selectedEl) {
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: "Error: Selected item not found in list",
                icon: `/assets/logo.svg`,
                timeout: 2500,
            });
            return;
        }

        const isDir = selectedEl.dataset.isDirectory === "true";
        const name = selectedEl.textContent.trim();

        const confirmMsg = isDir
            ? `Are you sure you want to delete the folder "${name}"? This cannot be undone`
            : `Are you sure you want to delete the file "${name}"? This cannot be undone`;

        await parent.xen.dialog
            .confirm({
                title: "Confirm Deletion",
                body: confirmMsg,
            })
            .then(async (res) => {
                if (res === true) {
                    try {
                        await parent.xen.fs.rm(selectedPath);
                        parent.xen.notifications.spawn({
                            title: "XenOS Policy",
                            description: `${isDir ? "Folder" : "File"} deleted: ${name}`,
                            icon: `/assets/logo.svg`,
                            timeout: 2500,
                        });
                        loadPolicies(currentPolicy);
                    } catch (e) {
                        parent.xen.notifications.spawn({
                            title: "XenOS Policy",
                            description: `Failed to delete ${name}: ${e.message}`,
                            icon: `/assets/logo.svg`,
                            timeout: 3000,
                        });
                    }
                }
            });
    }

    async function createPolicy() {
        let promptBody = "";
        let placeholder = "";
        let canCreateFolder = true;
        let canCreateFile = false;

        if (currentPolicy === POLICY_ROOT) {
            promptBody = "Enter a policy type (view documentation for more info)";
            placeholder = "";
            canCreateFile = false;
        } else {
            promptBody = "Enter a name for the policy (Ex. custom.json)";
            placeholder = "custom.json";
            canCreateFile = true;
        }

        const name = await parent.xen.dialog.prompt({
            title: "Create New Policy Entry",
            body: promptBody,
            placeholder: placeholder,
        });

        if (!name) return;

        const safeName = name.trim().replace(/[^a-zA-Z0-9-._/]/g, "");
        if (!safeName) {
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: "Invalid name provided",
                icon: `/assets/logo.svg`,
                timeout: 2500,
            });
            return;
        }

        const newPath = `${currentPolicy}${safeName}`;
        const isFolderAttempt = safeName.endsWith("/");
        const isFileAttempt = !isFolderAttempt;

        if (isFolderAttempt && !canCreateFolder) {
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: "Cannot create folders here",
                icon: `/assets/logo.svg`,
                timeout: 4000,
            });
            return;
        }
        if (isFileAttempt && !canCreateFile) {
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: "Only folders can be created in /usr/policies/",
                icon: `/assets/logo.svg`,
                timeout: 4000,
            });
            return;
        }
        if (isFileAttempt && !safeName.endsWith(".json")) {
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: "Only JSON files can be created",
                icon: `/assets/logo.svg`,
                timeout: 4000,
            });
            return;
        }

        try {
            if (isFolderAttempt) {
                await parent.xen.fs.mkdir(newPath);
                parent.xen.notifications.spawn({
                    title: "XenOS Policy",
                    description: `Folder created: ${safeName}`,
                    icon: `/assets/logo.svg`,
                    timeout: 2500,
                });
            } else {
                const initialContent = JSON.stringify({}, null, 2);
                await parent.xen.fs.write(newPath, initialContent);
                parent.xen.notifications.spawn({
                    title: "XenOS Policy",
                    description: `File created: ${safeName}`,
                    icon: `/assets/logo.svg`,
                    timeout: 2500,
                });
            }
            loadPolicies(currentPolicy);
        } catch (e) {
            parent.xen.notifications.spawn({
                title: "XenOS Policy",
                description: `Failed to create ${safeName}: ${e.message}`,
                icon: `/assets/logo.svg`,
                timeout: 3000,
            });
        }
    }

    navBack.addEventListener("click", () => {
        if (currentPolicy === POLICY_ROOT) {
            return;
        }

        const parts = currentPolicy.split("/").filter(Boolean);
        parts.pop();

        currentPolicy = "/" + parts.join("/") + (parts.length > 0 ? "/" : "");

        if (
            !currentPolicy.startsWith(POLICY_ROOT) ||
            currentPolicy.split("/").filter(Boolean).length <
            POLICY_ROOT.split("/").filter(Boolean).length
        ) {
            currentPolicy = POLICY_ROOT;
        }

        loadPolicies(currentPolicy);
    });

    savePolicyBtn.addEventListener("click", savePolicy);
    rmPolicy.addEventListener("click", deletePolicy);
    createPolicyBtn.addEventListener("click", createPolicy);

    try {
        const settings = parent.xen.settings.get("network-settings");
        if (settings && settings.url) {
            wispIn.value = settings.url;
        }
    } catch (e) { }

    saveWispBtn.addEventListener("click", async () => {
        const url = wispIn.value.trim();
        if (url) {
            try {
                const s = parent.xen.settings.get("network-settings");
                s.url = url;
                parent.xen.settings.set("network-settings", s);
                parent.xen.net.setUrl(url);
                parent.xen.notifications.spawn({
                    title: "XenOS",
                    description: `Wisp URL set to: ${url}`,
                    icon: `/assets/logo.svg`,
                    timeout: 2500,
                });
            } catch (e) {
                parent.xen.notifications.spawn({
                    title: "XenOS",
                    description: `Failed to set Wisp URL: ${e.message}`,
                    icon: `/assets/logo.svg`,
                    timeout: 3000,
                });
            }
        } else {
            const defaultUrl =
                (location.protocol === "https:" ? "wss" : "ws") +
                "://" +
                location.host +
                "/wisp/";
            try {
                const s = parent.xen.settings.get("network-settings");
                s.url = defaultUrl;
                parent.xen.settings.set("network-settings", s);
                parent.xen.net.setUrl(defaultUrl);
                wispIn.value = defaultUrl;
                parent.xen.notifications.spawn({
                    title: "XenOS",
                    description: `Wisp URL reset to default: ${defaultUrl}`,
                    icon: `/assets/logo.svg`,
                    timeout: 2500,
                });
            } catch (e) {
                parent.xen.notifications.spawn({
                    title: "XenOS",
                    description: `Failed to reset Wisp URL to default: ${e.message}`,
                    icon: `/assets/logo.svg`,
                    timeout: 3000,
                });
            }
        }
    });

    updateBtn.addEventListener("click", async () => {
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                await reg.unregister();
            }
            parent.xen.settings.remove("build-cache");
            window.parent.postMessage({ type: "reload-site" }, "*");
        } catch (e) {
            parent.xen.notifications.spawn({
                title: "XenOS",
                description: `Failed to check for updates: ${e.message}`,
                icon: `/assets/logo.svg`,
                timeout: 3000,
            });
        }
    });

    resetBtn.addEventListener("click", async () => {
        await parent.xen.dialog
            .confirm({
                title: "XenOS",
                body: "Are you sure you would like to reset your instance? This will delete ALL of your files and settings",
            })
            .then(async (res) => {
                if (res === true) {
                    try {
                        localStorage.removeItem("xen-settings");
                        await parent.xen.fs.wipe();
                        const reg = await navigator.serviceWorker.getRegistration();
                        if (reg) {
                            await reg.unregister();
                        }
                        window.parent.postMessage({ type: "reload-site" }, "*");
                    } catch (e) {
                        parent.xen.notifications.spawn({
                            title: "XenOS",
                            description: `Failed to reset instance: ${e.message}`,
                            icon: `/assets/logo.svg`,
                            timeout: 3000,
                        });
                    }
                }
            });
    });

    async function loadWallpapers() {
        try {
            const currentWallpaper = await parent.xen.wallpaper.get();
            currentWpImg.src = currentWallpaper || "";
            currentWpImg.style.display = currentWallpaper ? "block" : "none";

            const wallpapers = await parent.xen.wallpaper.list();
            wpGallery.innerHTML = "";
            if (galleryEmptyMsg) galleryEmptyMsg.style.display = "none";

            if (wallpapers.length === 0) {
                if (galleryEmptyMsg) galleryEmptyMsg.style.display = "block";
            } else {
                wallpapers.forEach((wp) => {
                    if (wp.isFile && wp.name.match(/\.(png|jpe?g|webp)$/i)) {
                        const item = document.createElement("div");
                        item.classList.add("wallpaper-gallery-item");
                        item.style.backgroundImage = `url('/fs/usr/wallpapers/${wp.name}')`;
                        item.dataset.filename = wp.name;

                        item.addEventListener("click", async () => {
                            await parent.xen.wallpaper.set(wp.name);
                            loadWallpapers();
                            parent.xen.notifications.spawn({
                                title: "XenOS UI",
                                description: `Wallpaper set to ${wp.name}`,
                                icon: `/assets/logo.svg`,
                                timeout: 2000,
                            });
                        });

                        wpGallery.appendChild(item);
                    }
                });
            }
        } catch (e) {
            parent.xen.notifications.spawn({
                title: "XenOS UI",
                description: `Failed to load wallpapers: ${e.message}`,
                icon: `/assets/logo.svg`,
                timeout: 3000,
            });
        }
    }

    uploadWpFileBtn.addEventListener("click", async () => {
        try {
            await parent.xen.wallpaper.upload("prompt");
            loadWallpapers();
            parent.xen.notifications.spawn({
                title: "XenOS UI",
                description: "Wallpaper uploaded successfully!",
                icon: `/assets/logo.svg`,
                timeout: 2500,
            });
        } catch (e) {
            parent.xen.notifications.spawn({
                title: "XenOS UI",
                description: `Failed to upload wallpaper: ${e.message}`,
                icon: `/assets/logo.svg`,
                timeout: 3000,
            });
        }
    });

    uploadWpUrlBtn.addEventListener("click", async () => {
        const url = await parent.xen.dialog.prompt({
            title: "Upload Wallpaper",
            body: "Enter the URL of the image:",
            placeholder: `${location.origin}/assets/wallpaper.webp`,
        });

        if (url) {
            try {
                await parent.xen.wallpaper.upload("url", url);
                loadWallpapers();
                parent.xen.notifications.spawn({
                    title: "XenOS UI",
                    description: "Wallpaper uploaded from URL",
                    icon: `/assets/logo.svg`,
                    timeout: 2500,
                });
            } catch (e) {
                parent.xen.notifications.spawn({
                    title: "XenOS UI",
                    description: `Failed to upload wallpaper from URL: ${e.message}`,
                    icon: `/assets/logo.svg`,
                    timeout: 3000,
                });
            }
        }
    });

    uploadWpFsBtn.addEventListener("click", async () => {
        try {
            await parent.xen.wallpaper.upload("fs");
            loadWallpapers();
            parent.xen.notifications.spawn({
                title: "XenOS UI",
                description: "Wallpaper uploaded successfully!",
                icon: `/assets/logo.svg`,
                timeout: 2500,
            });
        } catch (e) {
            parent.xen.notifications.spawn({
                title: "XenOS UI",
                description: `Failed to upload wallpaper: ${e.message}`,
                icon: `/assets/logo.svg`,
                timeout: 3000,
            });
        }
    });

    rmWpBtn.addEventListener("click", async () => {
        const currentWallpaper = await parent.xen.wallpaper.get();
        if (!currentWallpaper || currentWallpaper.startsWith("/assets/wallpaper.webp")) {
            parent.xen.notifications.spawn({
                title: "XenOS UI",
                description: "No custom wallpaper set to remove",
                icon: `/assets/logo.svg`,
                timeout: 2500,
            });
            return;
        }

        const confirmRemove = await parent.xen.dialog.confirm({
            title: "Confirm Removal",
            body: "Are you sure you want to remove your wallpaper? This cannot be undone",
        });

        if (confirmRemove) {
            try {
                const filenameMatch = currentWallpaper.match(/\/fs\/usr\/wallpapers\/(.+)$/);
                const filename = filenameMatch ? filenameMatch[1] : undefined;

                await parent.xen.wallpaper.remove(filename);
                loadWallpapers();
                parent.xen.notifications.spawn({
                    title: "XenOS UI",
                    description: "Wallpaper removed!",
                    icon: `/assets/logo.svg`,
                    timeout: 2500,
                });
            } catch (e) {
                parent.xen.notifications.spawn({
                    title: "XenOS UI",
                    description: `Failed to remove wallpaper: ${e.message}`,
                    icon: `/assets/logo.svg`,
                    timeout: 3000,
                });
            }
        }
    });

    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            const id = item.dataset.section + "-section";

            navItems.forEach((nav) => nav.classList.remove("active"));
            item.classList.add("active");

            sections.forEach((section) => {
                if (section.id === id) {
                    section.classList.add("active");
                    if (item.dataset.section === "policy") {
                        loadPolicies(currentPolicy);
                    } else if (item.dataset.section === "ui") {
                        loadWallpapers();
                    } else {
                        resetPolicyEditor();
                    }
                } else {
                    section.classList.remove("active");
                }
            });
        });
    });

    policyContent.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = policyContent.selectionStart;
            const end = policyContent.selectionEnd;

            const val = policyContent.value;
            const indent = '    ';

            policyContent.value = val.substring(0, start) + indent + val.substring(end);
            policyContent.selectionStart = policyContent.selectionEnd = start + indent.length;
        }
    });

    document.querySelector(".nav-item.active").click();
}

main();
