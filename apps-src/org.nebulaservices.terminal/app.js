class Terminal {
    constructor() {
        this.sessions = new Map();
        this.activeSessionId = null;
        this.tabCounter = 0;
        this.draggedTab = null;
        
        this.termContainer = document.getElementById("terminal-container");
        this.tabsContainer = document.getElementById("tabs");
        this.newTabBtn = document.getElementById("new-tab");
        
        this.init();
    }

    init() {
        this.newTabBtn.addEventListener("click", () => this.createTab());
        document.addEventListener("keydown", (e) => this.handleGlobalKeydown(e));
        
        this.tabsContainer.addEventListener("dragover", (e) => e.preventDefault());
        this.tabsContainer.addEventListener("drop", (e) => this.handleTabDrop(e));
        
        this.createTab();
    }

    createTab() {
        const sessionId = ++this.tabCounter;
        
        const tabEl = document.createElement("div");
        tabEl.className = "tab";
        tabEl.draggable = true;
        tabEl.innerHTML = `
            <span class="tab-title">Terminal ${sessionId}</span> 
            <i class="fa fa-times tab-close"></i>
        `;
        
        tabEl.style.opacity = "0";
        tabEl.style.transform = "translateY(-10px)";
        this.tabsContainer.appendChild(tabEl);
        
        requestAnimationFrame(() => {
            tabEl.style.transition = "all 0.2s ease";
            tabEl.style.opacity = "1";
            tabEl.style.transform = "translateY(0)";
        });

        const termEl = document.createElement("div");
        termEl.className = "terminal";
        termEl.style.display = "none";
        this.termContainer.appendChild(termEl);

        const session = new TerminalSession(sessionId, tabEl, termEl, this);
        this.sessions.set(sessionId, session);

        tabEl.addEventListener("click", (e) => {
            if (!e.target.classList.contains("tab-close")) {
                this.setActiveTab(sessionId);
            }
        });
        
        tabEl.querySelector(".tab-close").addEventListener("click", (e) => {
            e.stopPropagation();
            this.closeTab(sessionId);
        });

        tabEl.addEventListener("dragstart", (e) => this.handleDragStart(e, sessionId));
        tabEl.addEventListener("dragend", (e) => this.handleDragEnd(e));

        this.setActiveTab(sessionId);
    }

    setActiveTab(sessionId) {
        this.sessions.forEach((session, id) => {
            session.tabEl.classList.toggle("active", id === sessionId);
            session.termEl.style.display = id === sessionId ? "block" : "none";
        });
        
        this.activeSessionId = sessionId;

        const activeSession = this.sessions.get(sessionId);

        if (activeSession) {
            activeSession.focus();
        }
    }

    closeTab(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.tabEl.style.transition = "all 0.2s ease";
        session.tabEl.style.opacity = "0";
        session.tabEl.style.transform = "translateX(-20px)";
        
        setTimeout(() => {
            session.destroy();
            this.sessions.delete(sessionId);

            if (this.sessions.size === 0) {
                this.createTab();
            } else if (this.activeSessionId === sessionId) {
                const firstSessionId = this.sessions.keys().next().value;
                this.setActiveTab(firstSessionId);
            }
        }, 200);
    }

    handleDragStart(e, sessionId) {
        this.draggedTab = { element: e.target, sessionId };

        e.target.style.opacity = "0.5";
        e.dataTransfer.effectAllowed = "move";
    }

    handleDragEnd(e) {
        e.target.style.opacity = "1";
        this.draggedTab = null;
    }

    handleTabDrop(e) {
        e.preventDefault();
        if (!this.draggedTab) return;

        const targetTab = e.target.closest(".tab");
        if (!targetTab || targetTab === this.draggedTab.element) return;

        const draggedIndex = Array.from(this.tabsContainer.children).indexOf(this.draggedTab.element);
        const targetIndex = Array.from(this.tabsContainer.children).indexOf(targetTab);

        if (draggedIndex < targetIndex) {
            this.tabsContainer.insertBefore(this.draggedTab.element, targetTab.nextSibling);
        } else {
            this.tabsContainer.insertBefore(this.draggedTab.element, targetTab);
        }
    }

    getActiveSession() {
        return this.sessions.get(this.activeSessionId);
    }

    handleGlobalKeydown(e) {
        if (e.ctrlKey && e.key === "t") {
            e.preventDefault();
            this.createTab();
            return;
        }

        const activeSession = this.getActiveSession();

        if (activeSession) {
            activeSession.handleKeydown(e);
        }
    }
}

class TerminalSession {
    constructor(id, tabEl, termEl, terminal) {
        this.id = id;
        this.tabEl = tabEl;
        this.termEl = termEl;
        this.terminal = terminal;
        
        this.shell = new parent.xen.shell();
        this.shell.init();
        
        this.currentLine = "";
        this.cursorPosition = 0;
        this.history = [];
        this.historyIndex = -1;
        this.isRunning = false;
        this.completions = [];
        this.completionIndex = -1;
        this.originalInput = "";
        
        this.init();
    }

    init() {
        this.printPrompt();
    }

    destroy() {
        this.tabEl.remove();
        this.termEl.remove();
    }

    focus() {
        this.scrollToBottom();
    }

    shortenPath(path) {
        const home = this.shell.getEnv("HOME") || "/usr";

        if (path === home) {
            return "~";
        } else if (path.startsWith(home + "/")) {
            return "~" + path.substring(home.length);
        }

        return path;
    }

    printPrompt() {
        const user = "user";
        const host = location.hostname;
        const cwd = this.shortenPath(this.shell.getCwd());
        
        const promptEl = document.createElement("div");
        promptEl.className = "prompt-line";
        promptEl.innerHTML = `
            <span class="prompt-prefix">${user}@${host}:${cwd}$ </span>
            <span class="prompt-input"></span>
            <span class="cursor"></span>
        `;
        
        this.termEl.appendChild(promptEl);
        this.updatePromptInput();
        this.scrollToBottom();
    }

    updatePromptInput() {
        const currentPromptEl = this.termEl.querySelector(".prompt-line:last-child");
        if (!currentPromptEl) return;
        
        const inputEl = currentPromptEl.querySelector(".prompt-input");
        const cursorEl = currentPromptEl.querySelector(".cursor");
        
        if (!inputEl || !cursorEl) return;

        const beforeCursor = this.currentLine.substring(0, this.cursorPosition);
        const afterCursor = this.currentLine.substring(this.cursorPosition);
        
        inputEl.innerHTML = '';
        
        if (beforeCursor) {
            const beforeSpan = document.createElement('span');
            beforeSpan.textContent = beforeCursor;
            inputEl.appendChild(beforeSpan);
        }
        
        inputEl.appendChild(cursorEl);
        
        if (afterCursor) {
            const afterSpan = document.createElement('span');
            afterSpan.textContent = afterCursor;
            inputEl.appendChild(afterSpan);
        }
    }

    scrollToBottom() {
        this.termEl.scrollTop = this.termEl.scrollHeight;
    }

    async handleKeydown(e) {
        if (this.isRunning) {
            if (e.ctrlKey && e.key === "c") {
                e.preventDefault();
                this.isRunning = false;
                
                const currentPromptEl = this.termEl.querySelector(".prompt-line:last-child");

                if (currentPromptEl) {
                    const cursorEl = currentPromptEl.querySelector(".cursor");
                    if (cursorEl) cursorEl.remove();
                    
                    const inputEl = currentPromptEl.querySelector(".prompt-input");
                    if (inputEl) {
                        inputEl.textContent = this.currentLine + "^C";
                    }
                }
                
                this.currentLine = "";
                this.cursorPosition = 0;
                this.resetCompletions();
                this.printPrompt();
            }

            return;
        }

        switch (e.key) {
            case "Enter":
                e.preventDefault();
                await this.executeCommand();
                break;
                
            case "Backspace":
                e.preventDefault();

                if (e.ctrlKey) {
                    if (this.cursorPosition > 0) {
                        let pos = this.cursorPosition - 1;

                        while (pos > 0 && /\s/.test(this.currentLine[pos])) {
                            pos--;
                        }

                        while (pos > 0 && /\S/.test(this.currentLine[pos])) {
                            pos--;
                        }

                        if (pos > 0 && /\s/.test(this.currentLine[pos])) {
                            pos++;
                        }
                        
                        this.currentLine = this.currentLine.slice(0, pos) + this.currentLine.slice(this.cursorPosition);
                        this.cursorPosition = pos;

                        this.resetCompletions();
                        this.updatePromptInput();
                    }
                } else {
                    if (this.cursorPosition > 0) {
                        this.currentLine = this.currentLine.slice(0, this.cursorPosition - 1) + 
                                         this.currentLine.slice(this.cursorPosition);
                        this.cursorPosition--;
                        this.resetCompletions();
                        this.updatePromptInput();
                    }
                }

                break;
                
            case "Delete":
                e.preventDefault();

                if (this.cursorPosition < this.currentLine.length) {
                    this.currentLine = this.currentLine.slice(0, this.cursorPosition) + 
                                     this.currentLine.slice(this.cursorPosition + 1);
                    this.resetCompletions();
                    this.updatePromptInput();
                }

                break;
                
            case "ArrowLeft":
                e.preventDefault();
                if (e.ctrlKey) {
                    if (this.cursorPosition > 0) {
                        let pos = this.cursorPosition - 1;
                        while (pos > 0 && /\S/.test(this.currentLine[pos])) {
                            pos--;
                        }
                        while (pos > 0 && /\s/.test(this.currentLine[pos])) {
                            pos--;
                        }
                        while (pos > 0 && /\S/.test(this.currentLine[pos - 1])) {
                            pos--;
                        }
                        this.cursorPosition = pos;
                    }
                } else {
                    if (this.cursorPosition > 0) {
                        this.cursorPosition--;
                    }
                }
                this.updatePromptInput();
                break;
                
            case "ArrowRight":
                e.preventDefault();
                if (e.ctrlKey) {
                    if (this.cursorPosition < this.currentLine.length) {
                        let pos = this.cursorPosition;
                        while (pos < this.currentLine.length && /\S/.test(this.currentLine[pos])) {
                            pos++;
                        }
                        while (pos < this.currentLine.length && /\s/.test(this.currentLine[pos])) {
                            pos++;
                        }
                        this.cursorPosition = pos;
                    }
                } else {
                    if (this.cursorPosition < this.currentLine.length) {
                        this.cursorPosition++;
                    }
                }
                this.updatePromptInput();
                break;
                
            case "ArrowUp":
                e.preventDefault();
                this.navigateHistory(-1);
                break;
                
            case "ArrowDown":
                e.preventDefault();
                this.navigateHistory(1);
                break;
                
            case "Home":
                e.preventDefault();
                this.cursorPosition = 0;
                this.updatePromptInput();
                break;
                
            case "End":
                e.preventDefault();
                this.cursorPosition = this.currentLine.length;
                this.updatePromptInput();
                break;
                
            case "Tab":
                e.preventDefault();
                await this.handleTabCompletion();
                break;
                
            default:
                if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
                    e.preventDefault();
                    this.currentLine = this.currentLine.slice(0, this.cursorPosition) + 
                                     e.key + 
                                     this.currentLine.slice(this.cursorPosition);
                    this.cursorPosition++;
                    this.resetCompletions();
                    this.updatePromptInput();
                } else if (e.ctrlKey) {
                    switch (e.key) {
                        case "c":
                            e.preventDefault();
                            const currentPromptEl = this.termEl.querySelector(".prompt-line:last-child");
                            if (currentPromptEl) {
                                const cursorEl = currentPromptEl.querySelector(".cursor");
                                if (cursorEl) cursorEl.remove();
                                
                                const inputEl = currentPromptEl.querySelector(".prompt-input");
                                if (inputEl) {
                                    inputEl.textContent = this.currentLine + "^C";
                                }
                            }
                            
                            this.currentLine = "";
                            this.cursorPosition = 0;
                            this.resetCompletions();
                            this.printPrompt();
                            break;
                        case "d":
                            e.preventDefault();
                            this.terminal.closeTab(this.id);
                            break;
                    }
                }
                break;
        }
    }

    resetCompletions() {
        this.completions = [];
        this.completionIndex = -1;
        this.originalInput = "";
    }

    async handleTabCompletion() {
        const input = this.currentLine.trim();
        const parts = input.split(/\s+/);
        const isFirstWord = parts.length <= 1;
        const currentWord = parts[parts.length - 1] || "";

        if (this.completions.length === 0) {
            this.originalInput = currentWord;
            
            if (isFirstWord) {
                this.completions = await this.getCommandCompletions(currentWord);
            } else {
                this.completions = await this.getFileCompletions(currentWord);
            }
            
            this.completionIndex = -1;
        }

        if (this.completions.length > 0) {
            this.completionIndex = (this.completionIndex + 1) % this.completions.length;
            const completion = this.completions[this.completionIndex];
            
            parts[parts.length - 1] = completion;
            this.currentLine = parts.join(" ");
            this.cursorPosition = this.currentLine.length;
            this.updatePromptInput();
        }
    }

    async getCommandCompletions(prefix) {
        const commands = [
            "ls", "cd", "pwd", "mkdir", "rm", "cat", "grep", "touch", "cp", "mv",
            "clear", "history", "help", "export", "alias", "echo", "which", "find",
            "zip", "unzip", "mount", "umount", "link", "unlink", "readlink", "date"
        ];
        
        return commands.filter(cmd => cmd.startsWith(prefix)).sort();
    }

    async getFileCompletions(prefix) {
        try {
            let searchPath;
            let dir = "";
            let filename = prefix;
            
            if (prefix.startsWith("./")) {
                const relativePath = prefix.substring(2);
                const lastSlash = relativePath.lastIndexOf('/');
                
                if (lastSlash >= 0) {
                    dir = "./" + relativePath.substring(0, lastSlash + 1);
                    filename = relativePath.substring(lastSlash + 1);
                    searchPath = this.shell.getCwd() + "/" + relativePath.substring(0, lastSlash + 1);
                } else {
                    dir = "./";
                    filename = relativePath;
                    searchPath = this.shell.getCwd();
                }
            } else {
                const lastSlash = prefix.lastIndexOf('/');
                if (lastSlash >= 0) {
                    dir = prefix.substring(0, lastSlash + 1);
                    filename = prefix.substring(lastSlash + 1);
                    searchPath = dir || this.shell.getCwd();
                } else {
                    searchPath = this.shell.getCwd();
                }
            }
            
            const entries = await window.xen.fs.list(searchPath);
            
            const matches = entries
                .filter(entry => entry.name.startsWith(filename))
                .map(entry => {
                    const fullName = dir + entry.name;
                    return entry.isDirectory ? fullName + '/' : fullName;
                })
                .sort();
                
            return matches;
        } catch {
            return [];
        }
    }

    navigateHistory(direction) {
        if (this.history.length === 0) return;
        
        if (direction === -1) {
            if (this.historyIndex === -1) {
                this.historyIndex = this.history.length - 1;
            } else if (this.historyIndex > 0) {
                this.historyIndex--;
            }
        } else {
            if (this.historyIndex === -1) return;
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
            } else {
                this.historyIndex = -1;
                this.currentLine = "";
                this.cursorPosition = 0;
                this.updatePromptInput();
                return;
            }
        }
        
        this.currentLine = this.history[this.historyIndex];
        this.cursorPosition = this.currentLine.length;
        this.resetCompletions();
        this.updatePromptInput();
    }

    async executeCommand() {
        const command = this.currentLine.trim();
        
        const currentPromptEl = this.termEl.querySelector(".prompt-line:last-child");
        if (currentPromptEl) {
            const cursorEl = currentPromptEl.querySelector(".cursor");
            if (cursorEl) cursorEl.remove();
            
            const inputEl = currentPromptEl.querySelector(".prompt-input");
            if (inputEl) {
                inputEl.textContent = command;
            }
        }
        
        if (command && this.history[this.history.length - 1] !== command) {
            this.history.push(command);
        }
        this.historyIndex = -1;
        this.currentLine = "";
        this.cursorPosition = 0;
        this.resetCompletions();
        
        if (!command) {
            this.printPrompt();
            return;
        }
        
        this.isRunning = true;
        
        try {
            const output = await this.shell.runLine(command);
            
            if (output === "CLEAR_TERMINAL") {
                this.termEl.innerHTML = "";
            } else if (output && output.trim()) {
                if (command.startsWith("ls")) {
                    await this.printColoredLsOutput(output);
                } else {
                    this.printOutput(output);
                }
            }
        } catch (error) {
            let errorMessage = error.message;
            if (errorMessage.includes("command not found")) {
                this.printOutput(errorMessage, "error");
            } else {
                this.printOutput(errorMessage, "error");
            }
        }
        
        this.isRunning = false;
        this.printPrompt();
    }

    printOutput(text, type = "normal") {
        const outputEl = document.createElement("div");
        outputEl.className = `output ${type}`;
        outputEl.textContent = text;
        this.termEl.appendChild(outputEl);
        this.scrollToBottom();
    }

    async printColoredLsOutput(output) {
        if (!output.trim()) return;
        
        const names = output.split("\n").filter(Boolean);
        const outputEl = document.createElement("div");
        outputEl.className = "output ls-output";
        
        for (const name of names) {
            try {
                const fullPath = this.shell.getCwd() === "/" ? `/${name}` : `${this.shell.getCwd()}/${name}`;
                const stat = await window.xen.fs.stat(fullPath);
                
                const span = document.createElement("span");
                span.textContent = name;
                
                if (stat.isDirectory) {
                    span.className = "ls-dir";
                } else if (name.endsWith(".sh") || name.endsWith(".xs") || name.endsWith(".js")) {
                    span.className = "ls-exe";
                } else {
                    span.className = "ls-file";
                }
                
                outputEl.appendChild(span);
                outputEl.appendChild(document.createTextNode("  "));
            } catch {
                const span = document.createElement("span");
                span.textContent = name;
                span.className = "ls-file";
                outputEl.appendChild(span);
                outputEl.appendChild(document.createTextNode("  "));
            }
        }
        
        this.termEl.appendChild(outputEl);
        this.scrollToBottom();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new Terminal();
});