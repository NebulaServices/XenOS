class Main {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.tabCounter = 0;
        this.history = [];
        this.bookmarks = this.loadBookmarks();
        this.visitCounts = this.loadVisitCounts();
        this.selectedSuggestion = -1;
        this.isIconMode = false;
        this.urlUpdateInterval = null;

        this.initElements();
        this.initEventListeners();
        this.initKeyboardShortcuts();
        this.initContextMenus();
        this.createNewTab();
        // this.renderBookmarksBar();

        //const bookmarksVisible = window.xen?.settings?.get('bookmarks-visible') ?? true;
        // this.toggleBookmarksBar(bookmarksVisible);

        const savedWidth = window.xen?.settings?.get('sidebar-width') || 250;
        this.tabSidebar.style.width = `${savedWidth}px`;
        this.checkIconMode(savedWidth);

        this.startUrlMonitoring();

        firstTime();
    }

    initElements() {
        this.tabSidebar = document.getElementById('tabSidebar');
        this.tabList = document.getElementById('tabList');
        this.newTabBtn = document.getElementById('newTabBtn');
        this.backBtn = document.getElementById('backBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.reloadBtn = document.getElementById('reloadBtn');
        this.omnibox = document.getElementById('omnibox');
        this.omniboxSuggestions = document.getElementById('omniboxSuggestions');
        this.historyBtn = document.getElementById('historyBtn');
        // this.bookmarksBar = document.getElementById('bookmarksBar');
        // this.bookmarksList = document.getElementById('bookmarksList');
        this.contentArea = document.getElementById('contentArea');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.resizeHandle = document.getElementById('resizeHandle');
        this.mainContent = document.querySelector('.main-content');
    }

    initEventListeners() {
        this.newTabBtn.addEventListener('click', () => this.createNewTab());
        this.backBtn.addEventListener('click', () => this.goBack());
        this.forwardBtn.addEventListener('click', () => this.goForward());
        this.reloadBtn.addEventListener('click', () => this.reload());
        this.historyBtn.addEventListener('click', () => this.showHistory());

        this.omnibox.addEventListener('input', (e) => this.handleOmniboxInput(e));
        this.omnibox.addEventListener('keydown', (e) => this.handleOmniboxKeydown(e));
        this.omnibox.addEventListener('focus', () => this.showSuggestions());
        this.omnibox.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 150);
        });

        this.initResizeHandle();
        this.initTabDragAndDrop();
    }

    initResizeHandle() {
        let isResizing = false;

        this.resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;

            this.resizeHandle.classList.add('resizing');
            this.mainContent.classList.add('resize-mode');
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';

            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                cursor: ew-resize;
            `;
            document.body.appendChild(overlay);

            const handleResize = (e) => {
                if (!isResizing) return;
                const newWidth = Math.max(48, Math.min(400, e.clientX));
                this.tabSidebar.style.width = `${newWidth}px`;
                this.checkIconMode(newWidth);
            };

            const stopResize = () => {
                if (!isResizing) return;
                isResizing = false;

                overlay.remove();
                this.resizeHandle.classList.remove('resizing');
                this.mainContent.classList.remove('resize-mode');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', stopResize);

                // Save width to settings
                const width = parseInt(this.tabSidebar.style.width);
                if (window.xen?.settings) {
                    window.xen.settings.set('sidebar-width', width);
                }
            };

            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        });
    }

    initTabDragAndDrop() {
        this.tabList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            const afterElement = this.getDragAfterElement(this.tabList, e.clientY);

            if (afterElement == null) {
                this.tabList.appendChild(dragging);
            } else {
                this.tabList.insertBefore(dragging, afterElement);
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.tab-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch (e.key) {
                    case 't':
                        e.preventDefault();
                        this.createNewTab();
                        break;
                    case 'w':
                        e.preventDefault();
                        if (this.activeTabId) {
                            this.closeTab(this.activeTabId);
                        }
                        break;
                    case 'r':
                        e.preventDefault();
                        this.reload();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.omnibox.focus();
                        this.omnibox.select();
                        break;
                }

                /*
                if (e.shiftKey && e.key === 'B') {
                    e.preventDefault();
                    this.toggleBookmarksBar();
                }
                */
            }
        });
    }

    initContextMenus() {
        if (window.xen?.contextMenu) {
            window.xen.contextMenu.attach(this.bookmarksBar, {
                root: [
                    {
                        title: 'Add Bookmark',
                        onClick: () => this.addBookmark()
                    }
                ]
            });
        }
    }

    checkIconMode(width) {
        const wasIconMode = this.isIconMode;
        this.isIconMode = width <= 80;

        if (this.isIconMode !== wasIconMode) {
            this.tabSidebar.classList.toggle('icon-mode', this.isIconMode);

            if (this.isIconMode) {
                this.addTooltipsToTabs();
            } else {
                this.removeTooltipsFromTabs();
            }
        }
    }

    addTooltipsToTabs() {
        this.tabs.forEach(tab => {
            if (tab.element && !tab.element.querySelector('.tab-tooltip')) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tab-tooltip';
                tooltip.textContent = this.getDisplayUrl(tab.url) || 'New Tab';
                tab.element.appendChild(tooltip);
            }
        });
    }

    removeTooltipsFromTabs() {
        this.tabs.forEach(tab => {
            if (tab.element) {
                const tooltip = tab.element.querySelector('.tab-tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            }
        });
    }

    getDisplayUrl(url) {
        if (!url) return '';
        if (window.xen?.net?.decodeUrl && url.includes(location.origin)) {
            try {
                return window.xen.net.decodeUrl(url);
            } catch (e) {
                return url;
            }
        }
        return url;
    }

    startUrlMonitoring() {
        this.urlUpdateInterval = setInterval(() => {
            this.checkForUrlUpdates();
        }, 1000);
    }

    checkForUrlUpdates() {
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (!activeTab || !activeTab.iframe) return;

        try {
            const currentUrl = activeTab.iframe.contentWindow.location.href;
            if (currentUrl !== activeTab.url && !currentUrl.includes('about:blank')) {
                this.updateTabUrl(activeTab, currentUrl);
            }
        } catch { }
    }

    updateTabUrl(tab, newUrl) {
        if (tab.url !== newUrl) {
            tab.url = newUrl;

            if (tab.id === this.activeTabId) {
                this.omnibox.value = this.getDisplayUrl(newUrl);
            }

            this.updateTabInfo(tab, newUrl);

            const decodedUrl = this.getDisplayUrl(newUrl);
            this.visitCounts[decodedUrl] = (this.visitCounts[decodedUrl] || 0) + 1;
            this.saveVisitCounts();

            if (tab.history[tab.historyIndex] !== newUrl) {
                tab.history = tab.history.slice(0, tab.historyIndex + 1);
                tab.history.push(newUrl);
                tab.historyIndex = tab.history.length - 1;
                this.updateNavButtons(tab);
            }
        }
    }

    createNewTab() {
        const tabId = ++this.tabCounter;
        const tab = {
            id: tabId,
            title: 'New Tab',
            url: '',
            favicon: null,
            history: [],
            historyIndex: -1,
            element: null,
            iframe: null
        };

        this.tabs.push(tab);
        this.renderTab(tab);
        this.switchToTab(tabId);
        this.omnibox.focus();
    }

    renderTab(tab) {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab-item';
        tabEl.draggable = true;
        tabEl.dataset.tabId = tab.id;

        const favicon = document.createElement('i');
        favicon.className = 'fas fa-globe tab-favicon';

        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });

        tabEl.appendChild(favicon);
        tabEl.appendChild(title);
        tabEl.appendChild(closeBtn);

        if (this.isIconMode) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tab-tooltip';
            tooltip.textContent = this.getDisplayUrl(tab.url) || 'New Tab';
            tabEl.appendChild(tooltip);
        }

        tabEl.addEventListener('click', (e) => {
            if (this.isIconMode && e.target.closest('.tab-item') === tabEl) {
                const rect = tabEl.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                if (clickX > rect.width - 20 && clickY < 20) {
                    this.closeTab(tab.id);
                    return;
                }
            }
            this.switchToTab(tab.id);
        });

        tabEl.addEventListener('dragstart', () => {
            tabEl.classList.add('dragging');
        });

        tabEl.addEventListener('dragend', () => {
            tabEl.classList.remove('dragging');
            this.reorderTabs();
        });

        this.tabList.appendChild(tabEl);
        tab.element = tabEl;
    }

    reorderTabs() {
        const tabElements = [...this.tabList.querySelectorAll('.tab-item')];
        const newOrder = [];

        tabElements.forEach(el => {
            const tabId = parseInt(el.dataset.tabId);
            const tab = this.tabs.find(t => t.id === tabId);
            if (tab) newOrder.push(tab);
        });

        this.tabs = newOrder;
    }

    switchToTab(tabId) {
        this.activeTabId = tabId;
        const activeTab = this.tabs.find(t => t.id === tabId);

        this.tabList.querySelectorAll('.tab-item').forEach(el => {
            el.classList.remove('active');
        });

        const tabEl = this.tabList.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabEl) tabEl.classList.add('active');

        this.contentArea.innerHTML = '';

        if (activeTab.url) {
            if (!activeTab.iframe) {
                activeTab.iframe = document.createElement('iframe');
                activeTab.iframe.className = 'content-frame';
                activeTab.iframe.src = window.xen?.net?.encodeUrl(this.getDisplayUrl(activeTab.url)) || activeTab.url;
            }
            this.contentArea.appendChild(activeTab.iframe);
        } else {
            this.contentArea.appendChild(this.welcomeScreen);
        }

        this.omnibox.value = this.getDisplayUrl(activeTab.url);
        this.updateNavButtons(activeTab);
    }

    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;

        const tab = this.tabs[tabIndex];
        tab.element.remove();
        this.tabs.splice(tabIndex, 1);

        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const nextTab = this.tabs[Math.min(tabIndex, this.tabs.length - 1)];
                this.switchToTab(nextTab.id);
            } else {
                this.createNewTab();
            }
        }
    }

    navigateToUrl(url) {
        if (!this.activeTabId) return;

        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (!activeTab) return;

        const originalUrl = url;

        if (!url.includes('.') && !url.startsWith('http')) {
            url = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
        } else if (!url.startsWith('http')) {
            url = `https://${url}`;
        }

        this.visitCounts[url] = (this.visitCounts[url] || 0) + 1;
        this.saveVisitCounts();

        const encodedUrl = window.xen?.net?.encodeUrl(url) || url;

        if (activeTab.url && activeTab.url !== encodedUrl) {
            activeTab.history = activeTab.history.slice(0, activeTab.historyIndex + 1);
            activeTab.history.push(encodedUrl);
            activeTab.historyIndex = activeTab.history.length - 1;
        } else if (!activeTab.url) {
            activeTab.history = [encodedUrl];
            activeTab.historyIndex = 0;
        }

        activeTab.url = encodedUrl;

        if (!activeTab.iframe) {
            activeTab.iframe = document.createElement('iframe');
            activeTab.iframe.className = 'content-frame';
        }

        activeTab.iframe.src = encodedUrl;

        this.contentArea.innerHTML = '';
        this.contentArea.appendChild(activeTab.iframe);

        this.updateTabInfo(activeTab, url);
        this.updateNavButtons(activeTab);
        this.omnibox.value = url;
    }

    updateTabInfo(tab, url) {
        try {
            const displayUrl = this.getDisplayUrl(url);
            const domain = new URL(displayUrl).hostname;
            tab.title = domain;

            const titleEl = tab.element.querySelector('.tab-title');
            if (titleEl) titleEl.textContent = tab.title;

            const tooltipEl = tab.element.querySelector('.tab-tooltip');
            if (tooltipEl) tooltipEl.textContent = displayUrl;

            const faviconEl = tab.element.querySelector('.tab-favicon');
            if (faviconEl) {
                const img = document.createElement('img');
                img.src = `https://www.google.com/s2/favicons?domain=${domain}`;
                img.className = 'tab-favicon';
                img.onerror = () => {
                    faviconEl.className = 'fas fa-globe tab-favicon';
                };
                img.onload = () => {
                    faviconEl.replaceWith(img);
                };
            }
        } catch (e) {
            tab.title = 'New Tab';
            const titleEl = tab.element.querySelector('.tab-title');
            if (titleEl) titleEl.textContent = tab.title;

            const tooltipEl = tab.element.querySelector('.tab-tooltip');
            if (tooltipEl) tooltipEl.textContent = 'New Tab';
        }
    }

    updateNavButtons(tab) {
        this.backBtn.disabled = tab.historyIndex <= 0;
        this.forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;
    }

    goBack() {
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (!activeTab || activeTab.historyIndex <= 0) return;

        activeTab.historyIndex--;
        const url = activeTab.history[activeTab.historyIndex];
        activeTab.url = url;
        activeTab.iframe.src = url;
        this.omnibox.value = this.getDisplayUrl(url);
        this.updateNavButtons(activeTab);
    }

    goForward() {
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;

        activeTab.historyIndex++;
        const url = activeTab.history[activeTab.historyIndex];
        activeTab.url = url;
        activeTab.iframe.src = url;
        this.omnibox.value = this.getDisplayUrl(url);
        this.updateNavButtons(activeTab);
    }

    reload() {
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (!activeTab || !activeTab.iframe) return;

        activeTab.iframe.src = activeTab.iframe.src;
    }

    showHistory() {
        window.xen.dialog.alert({
            title: 'XenOS',
            icon: '/assets/logo.svg',
            body: 'The history page is Wip!'
        })
    }

    handleOmniboxInput(e) {
        this.showSuggestions();
    }

    handleOmniboxKeydown(e) {
        const suggestions = this.omniboxSuggestions.querySelectorAll('.suggestion-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedSuggestion = Math.min(this.selectedSuggestion + 1, suggestions.length - 1);
            this.updateSuggestionSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedSuggestion = Math.max(this.selectedSuggestion - 1, -1);
            this.updateSuggestionSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedSuggestion >= 0 && suggestions[this.selectedSuggestion]) {
                const url = suggestions[this.selectedSuggestion].dataset.url;
                this.navigateToUrl(url);
            } else {
                this.navigateToUrl(this.omnibox.value);
            }
            this.hideSuggestions();
        } else if (e.key === 'Escape') {
            this.hideSuggestions();
        }
    }

    showSuggestions() {
        const query = this.omnibox.value.toLowerCase();
        const suggestions = this.getSuggestions(query);

        this.omniboxSuggestions.innerHTML = '';

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.dataset.url = suggestion.url;

            const icon = document.createElement('i');
            icon.className = `fas ${suggestion.icon} suggestion-icon`;

            const textDiv = document.createElement('div');
            textDiv.className = 'suggestion-text';

            const title = document.createElement('div');
            title.className = 'suggestion-title';
            title.textContent = suggestion.title;

            const url = document.createElement('div');
            url.className = 'suggestion-url';
            url.textContent = suggestion.url;

            textDiv.appendChild(title);
            textDiv.appendChild(url);
            item.appendChild(icon);
            item.appendChild(textDiv);

            item.addEventListener('click', () => {
                this.navigateToUrl(suggestion.url);
                this.hideSuggestions();
            });

            this.omniboxSuggestions.appendChild(item);
        });

        if (suggestions.length > 0) {
            this.omniboxSuggestions.style.display = 'block';
        } else {
            this.omniboxSuggestions.style.display = 'none';
        }

        this.selectedSuggestion = -1;
    }

    getSuggestions(query) {
        if (!query) return [];

        const suggestions = [];

        Object.entries(this.visitCounts)
            .filter(([url]) => url.toLowerCase().includes(query))
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .forEach(([url, count]) => {
                suggestions.push({
                    title: url,
                    url: url,
                    icon: 'fa-history'
                });
            });

        if (!query.includes('.')) {
            suggestions.unshift({
                title: `Search for "${query}"`,
                url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                icon: 'fa-search'
            });
        }

        return suggestions.slice(0, 8);
    }

    updateSuggestionSelection() {
        const suggestions = this.omniboxSuggestions.querySelectorAll('.suggestion-item');
        suggestions.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedSuggestion);
        });
    }

    hideSuggestions() {
        this.omniboxSuggestions.style.display = 'none';
        this.selectedSuggestion = -1;
    }

    toggleBookmarksBar(visible = null) {
        const isVisible = visible !== null ? visible : !this.bookmarksBar.classList.contains('visible');
        this.bookmarksBar.classList.toggle('visible', isVisible);

        if (window.xen?.settings) {
            window.xen.settings.set('bookmarks-visible', isVisible);
        }

        this.updateBookmarksCloseButton();
    }

    addBookmark() {
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (!activeTab || !activeTab.url) return;

        if (window.xen?.dialog) {
            window.xen.dialog.prompt({
                title: 'Add Bookmark',
                body: 'Enter bookmark name:',
                placeholder: activeTab.title
            }).then(name => {
                if (name) {
                    this.bookmarks.push({
                        name: name,
                        url: this.getDisplayUrl(activeTab.url),
                        favicon: activeTab.favicon
                    });
                    this.saveBookmarks();
                    this.renderBookmarksBar();
                }
            });
        }
    }

    renderBookmarksBar() {
        this.bookmarksList.innerHTML = '';

        this.bookmarks.forEach((bookmark, index) => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';
            item.draggable = true;

            if (bookmark.favicon) {
                const favicon = document.createElement('img');
                favicon.src = bookmark.favicon;
                favicon.className = 'bookmark-favicon';
                item.appendChild(favicon);
            } else {
                const icon = document.createElement('i');
                icon.className = 'fas fa-bookmark bookmark-favicon';
                item.appendChild(icon);
            }

            const text = document.createElement('span');
            text.textContent = bookmark.name;
            item.appendChild(text);

            item.addEventListener('click', () => {
                this.navigateToUrl(bookmark.url);
            });

            if (window.xen?.contextMenu) {
                window.xen.contextMenu.attach(item, {
                    root: [
                        {
                            title: 'Edit',
                            onClick: () => this.editBookmark(index)
                        },
                        {
                            title: 'Remove',
                            onClick: () => this.removeBookmark(index)
                        }
                    ]
                });
            }

            this.bookmarksList.appendChild(item);
        });

        this.updateBookmarksCloseButton();
    }

    updateBookmarksCloseButton() {
        const existingClose = this.bookmarksBar.querySelector('.bookmarks-close');
        if (existingClose) {
            existingClose.remove();
        }

        if (this.bookmarksBar.classList.contains('visible')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'bookmarks-close';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.title = 'Hide bookmarks bar';
            closeBtn.addEventListener('click', () => {
                this.toggleBookmarksBar(false);
            });
            this.bookmarksBar.appendChild(closeBtn);
        }
    }

    editBookmark(index) {
        const bookmark = this.bookmarks[index];
        if (!bookmark || !window.xen?.dialog) return;

        window.xen.dialog.prompt({
            title: 'Edit Bookmark',
            body: 'Enter new name:',
            placeholder: bookmark.name
        }).then(name => {
            if (name) {
                bookmark.name = name;
                this.saveBookmarks();
                this.renderBookmarksBar();
            }
        });
    }

    removeBookmark(index) {
        this.bookmarks.splice(index, 1);
        this.saveBookmarks();
        this.renderBookmarksBar();
    }

    loadBookmarks() {
        try {
            return window.xen.settings.get('browser-bookmarks') || '[]';
        } catch {
            return [];
        }
    }

    saveBookmarks() {
        window.xen.settings.set('browser-bookmarks', this.bookmarks);
    }

    loadVisitCounts() {
        try {
            return window.xen.settins.get('browser-visits') || {};
        } catch {
            return {};
        }
    }

    saveVisitCounts() {
        window.xen.settings.set('browser-visits', this.visitCounts);
    }
}

function firstTime() {
    if (!window.xen.settings.get('browser-fv')) {
        window.xen.dialog.alert({
            title: 'XenOS',
            icon: '/assets/logo.svg',
            body: 'Welcome to XenOSes browser! This app is work-in-progress but it should behave just fine :D Also, there are keybinds! Just use alt instead of ctrl'
        });

        window.xen.settings.set('browser-fv', true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new Main();
    }, 500);
});