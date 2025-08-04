async function main() {
    const tabsEl = document.getElementById("tabs");
    const tabContentEl = document.getElementById("tabContent");
    const newFileBtn = document.getElementById("newFileBtn");
    const openFileBtn = document.getElementById("openFileBtn");
    const saveFileBtn = document.getElementById("saveFileBtn");
    const saveAsFileBtn = document.getElementById("saveAsFileBtn");
    const renameFileBtn = document.getElementById("renameFileBtn");

    const params = new URLSearchParams(window.location.search);

    let currentTabId = 0;
    const openFiles = new Map();

    async function createNewTab(name = "Untitled", content = "", filePath = null) {
        try {
            const c = await parent.xen.fs.read(filePath, 'text');

            if (c) {
                content = new String(c).toString();
            }
        } catch { };

        const id = ++currentTabId;
        const tab = document.createElement("div");

        tab.className = "tab";
        tab.dataset.tabId = id;
        tab.innerHTML = `
                <span>${name}</span>
                <i class="fa-solid fa-xmark close-tab-icon"></i>
            `;

        tabsEl.appendChild(tab);

        const editorPane = document.createElement("div");
        editorPane.className = "editor-tab-pane";
        editorPane.dataset.tabId = id;

        const textarea = document.createElement("textarea");
        textarea.value = content;
        editorPane.appendChild(textarea);
        tabContentEl.appendChild(editorPane);

        openFiles.set(id, {
            path: filePath,
            content: content,
            saved: !!filePath,
            name: name,
        });

        textarea.addEventListener("input", () => {
            const file = openFiles.get(id);
            file.content = textarea.value;
        });

        tab.addEventListener("click", (e) => {
            if (!e.target.classList.contains("close-tab-icon")) {
                activateTab(id);
            }
        });
        tab.querySelector(".close-tab-icon").addEventListener("click", (e) => {
            e.stopPropagation();
            closeTab(id);
        });

        activateTab(id);
    }

    function activateTab(id) {
        tabsEl.querySelectorAll(".tab").forEach((t) => {
            t.classList.remove("active");
        });
        tabContentEl.querySelectorAll(".editor-tab-pane").forEach((p) => {
            p.classList.remove("active");
        });

        const activeTab = tabsEl.querySelector(`.tab[data-tab-id="${id}"]`);
        const activePane = tabContentEl.querySelector(`.editor-tab-pane[data-tab-id="${id}"]`);

        if (activeTab && activePane) {
            activeTab.classList.add("active");
            activePane.classList.add("active");
            activePane.querySelector("textarea").focus();
        }
    }

    async function closeTab(id) {
        const file = openFiles.get(id);
        if (file && !file.saved) {
            const confirmed = await parent.xen.dialog.confirm({
                title: "Unsaved Changes",
                body: `Do you want to close without saving?`,
                icon: "/assets/logo.svg",
            });

            if (!confirmed) {
                return;
            }
        }

        const tabEl = tabsEl.querySelector(`.tab[data-tab-id="${id}"]`);
        const paneEl = tabContentEl.querySelector(`.editor-tab-pane[data-tab-id="${id}"]`);

        if (tabEl) tabEl.remove();
        if (paneEl) paneEl.remove();

        openFiles.delete(id);

        if (tabsEl.children.length > 0) {
            const firstRemainingTabId = parseInt(tabsEl.firstElementChild.dataset.tabId,);
            activateTab(firstRemainingTabId);
        } else {
            await createNewTab();
        }
    }

    async function saveCurrentFile() {
        const activeTabEl = tabsEl.querySelector(".tab.active");
        if (!activeTabEl) return;

        const id = parseInt(activeTabEl.dataset.tabId);
        const file = openFiles.get(id);

        if (!file) return;

        const textareaContent = tabContentEl.querySelector(`.editor-tab-pane[data-tab-id="${id}"] textarea`,).value;

        try {
            if (file.path) {
                await parent.xen.fs.write(file.path, textareaContent);
                file.saved = true;
                await parent.xen.notifications.spawn({
                    title: "Saved",
                    description: `File saved to ${file.path}`,
                    icon: "/assets/logo.svg",
                    timeout: 3000,
                });
            } else {
                await saveFileAs(id, textareaContent);
            }
        } catch (e) {
            await parent.xen.notifications.spawn({
                title: "Save Error",
                description: `Error saving file: ${e.message}`,
                icon: "/assets/logo.svg",
                timeout: 5000,
            });
        }
    }

    async function saveFileAs(id, content) {
        try {
            const h = await parent.xen.FilePicker.pick({});
            const newPath = h.path;

            if (!newPath) {
                return;
            }

            await parent.xen.fs.write(newPath, content);

            const file = openFiles.get(id);
            file.path = newPath;
            file.name = newPath.split("/").pop();
            file.saved = true;

            const activeTabEl = tabsEl.querySelector(
                `.tab[data-tab-id="${id}"]`,
            );
            if (activeTabEl) {
                activeTabEl.querySelector("span").textContent = file.name;
            }
            await parent.xen.notifications.spawn({
                title: "Saved As",
                description: `File saved as ${newPath}`,
                icon: "/assets/logo.svg",
                timeout: 3000,
            });
        } catch (e) {
            await parent.xen.notifications.spawn({
                title: "Error",
                description: `Error saving file: ${e.message}`,
                icon: "/assets/logo.svg",
                timeout: 5000,
            });
        }
    }

    async function openFile() {
        try {
            const pickerResult = await parent.xen.FilePicker.pick({
                title: "Open File",
                multiple: false,
                mode: "file",
            });

            if (pickerResult && pickerResult.path) {
                const filePath = Array.isArray(pickerResult.path)
                    ? pickerResult.path[0]
                    : pickerResult.path;

                let content = "";
                if (pickerResult.text) {
                    content = await (Array.isArray(pickerResult.text)
                        ? pickerResult.text[0]()
                        : pickerResult.text());
                } else if (pickerResult.content) {
                    content = Array.isArray(pickerResult.content)
                        ? String(pickerResult.content[0])
                        : String(pickerResult.content);
                }

                const fileName = filePath.split("/").pop();

                let existingTabId = null;
                for (const [tabId, file] of openFiles.entries()) {
                    if (file.path === filePath) {
                        existingTabId = tabId;
                        break;
                    }
                }

                if (existingTabId) {
                    activateTab(existingTabId);
                } else {
                    await createNewTab(fileName, content, filePath);
                }
            } else {
            }
        } catch (e) {
            if (e.name !== "AbortError") {
                await parent.xen.notifications.spawn({
                    title: "Error",
                    description: `Error opening file: ${e.message}`,
                    icon: "/assets/logo.svg",
                    timeout: 5000,
                });
            }
        }
    }

    async function renameCurrentFile() {
        const activeTabEl = tabsEl.querySelector(".tab.active");
        if (!activeTabEl) return;

        const id = parseInt(activeTabEl.dataset.tabId);
        const file = openFiles.get(id);

        if (!file || !file.path) {
            await parent.xen.notifications.spawn({
                title: "Rename Error",
                description: "Cannot rename an unsaved/new file",
                icon: "/assets/logo.svg",
                timeout: 3000,
            });
            return;
        }

        const oldPath = file.path;
        const oldName = file.name;

        const newName = await parent.xen.dialog.prompt({
            title: "Rename File",
            body: `Enter new name`,
            placeholder: oldName,
            icon: "/assets/logo.svg",
        });
        if (!newName || newName === oldName) {
            return;
        }

        try {
            const newPath = parent.xen.fs.normalizePath(
                oldPath.substring(0, oldPath.lastIndexOf("/")) +
                "/" +
                newName,
            );

            if (await parent.xen.fs.exists(newPath)) {
                await parent.xen.notifications.spawn({
                    title: "Rename Error",
                    description: `A file/directory named "${newName}" already exists`,
                    icon: "/assets/logo.svg",
                    timeout: 3000,
                });
                return;
            }

            await parent.xen.fs.move(oldPath, newPath);

            file.path = newPath;
            file.name = newName;
            file.saved = true;

            activeTabEl.querySelector("span").textContent = newName;
        } catch (e) {
            await parent.xen.notifications.spawn({
                title: "Rename Error",
                description: `Error renaming file: ${e.message}`,
                icon: "/assets/logo.svg",
                timeout: 5000,
            });
        }
    }

    newFileBtn.addEventListener("click", async () => await createNewTab());
    openFileBtn.addEventListener("click", openFile);
    saveFileBtn.addEventListener("click", saveCurrentFile);
    saveAsFileBtn.addEventListener("click", async () => {
        const activeTabEl = tabsEl.querySelector(".tab.active");
        if (!activeTabEl) return;
        const id = parseInt(activeTabEl.dataset.tabId);
        const textareaContent = tabContentEl.querySelector(
            `.editor-tab-pane[data-tab-id="${id}"] textarea`,
        ).value;
        await saveFileAs(id, textareaContent);
    });
    renameFileBtn.addEventListener("click", renameCurrentFile);
    await createNewTab();

    if (params.get('file')) {
        await createNewTab(
            params.get('file').split('/').at(-1),
            '',
            params.get('file')
        );
    }
}

main();
