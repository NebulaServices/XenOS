interface FileStats {
    name: string
    size: number
    isDirectory: boolean
    isFile: boolean
    lastModified: Date
}

class FileExplorer {
    private fs = window.xen.fs
    private cm = window.xen.ui.contextMenu
    private wm = window.xen.wm
    private currentPath = "/"
    private selectedItems: Set<string> = new Set()
    private history: string[] = ["/"]
    private historyPos = 0
    private viewMode: 'grid' | 'list' = 'grid'

    constructor() {
        setTimeout(() => this.init(), 100)
    }

    private formatSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB']
        let size = bytes
        let unitIndex = 0

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024
            unitIndex++
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`
    }

    private formatDate(date: Date): string {
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date)
    }

    private async init() {
        this.setupEventListeners()
        this.setupContextMenus()
        await this.loadPath("/")
        await this.loadMounts()
    }

    private setupEventListeners() {
        document.querySelector('.logo')?.addEventListener('click', () => this.loadPath('/'))
        document.getElementById('back')?.addEventListener('click', () => this.navigate('back'))
        document.getElementById('forward')?.addEventListener('click', () => this.navigate('forward'))
        document.getElementById('up')?.addEventListener('click', () => this.navigate('up'))
        document.getElementById('mount-btn')?.addEventListener('click', () => this.mount())

        const pathInput = document.getElementById('path-input') as HTMLInputElement
        pathInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.loadPath(pathInput.value)
        })

        const searchInput = document.getElementById('search') as HTMLInputElement
        searchInput?.addEventListener('input', () => this.handleSearch(searchInput.value))

        document.getElementById('view-toggle')?.addEventListener('click', () => {
            this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid'
            this.loadPath(this.currentPath)
        })
    }

    private setupContextMenus() {
        const commonOps = [
            {
                id: 'new-file',
                title: 'New File',
                handler: async () => {
                    const name = await this.showDialog('New File')
                    if (name) await this.fs.write(`${this.currentPath}/${name}`, '')
                    this.loadPath(this.currentPath)
                }
            },
            {
                id: 'new-folder',
                title: 'New Folder',
                handler: async () => {
                    const name = await this.showDialog('New Folder')
                    if (name) await this.fs.mkdir(`${this.currentPath}/${name}`)
                    this.loadPath(this.currentPath)
                }
            },
            {
                id: 'upload-file',
                title: 'Upload File',
                handler: async () => {
                    await this.fs.upload('file', this.currentPath)
                    this.loadPath(this.currentPath)
                }
            },
            {
                id: 'upload-folder',
                title: 'Upload Folder',
                handler: async () => {
                    await this.fs.upload('directory', this.currentPath)
                    this.loadPath(this.currentPath)
                }
            }
        ]

        const selectedOps = [
            {
                id: 'copy',
                title: 'Copy',
                handler: async () => {
                    const dest = await this.showDialog('Copy to', this.currentPath)
                    if (!dest) return
                    for (const item of this.selectedItems) {
                        await this.fs.copy(`${this.currentPath}/${item}`, `${dest}/${item}`)
                    }
                    this.loadPath(this.currentPath)
                }
            },
            {
                id: 'move',
                title: 'Move/Rename',
                handler: async () => {
                    const dest = await this.showDialog('Move to', this.currentPath)
                    if (!dest) return
                    for (const item of this.selectedItems) {
                        await this.fs.move(`${this.currentPath}/${item}`, `${dest}/${item}`)
                    }
                    this.loadPath(this.currentPath)
                }
            },
            {
                id: 'delete',
                title: 'Delete',
                handler: async () => {
                    const confirm = await this.showDialog('Delete selected items? Type "yes" to confirm')
                    if (confirm?.toLowerCase() !== 'yes') return
                    for (const item of this.selectedItems) {
                        await this.fs.rm(`${this.currentPath}/${item}`)
                    }
                    this.selectedItems.clear()
                    this.loadPath(this.currentPath)
                }
            },
            {
                id: 'compress',
                title: 'Compress',
                handler: async () => {
                    const dest = await this.showDialog('Save as', `${this.currentPath}/archive.zip`)
                    if (!dest) return
                    for (const item of this.selectedItems) {
                        await this.fs.compress(`${this.currentPath}/${item}`, dest)
                    }
                    this.loadPath(this.currentPath)
                }
            }
        ]

        // Register context menus
        commonOps.forEach(op => {
            this.cm.create({
                id: op.id,
                domain: 'explorer',
                title: op.title
            }, op.handler)
        })

        selectedOps.forEach(op => {
            this.cm.create({
                id: op.id,
                domain: 'explorer-selected',
                title: op.title
            }, op.handler)
        })
    }

    private async showDialog(title: string, defaultValue = ""): Promise<string | null> {
        return new Promise(resolve => {
            const win = this.wm.create({
                title,
                width: '400px',
                height: '150px',
                content: `
                    <div class="dialog">
                        <input type="text" value="${defaultValue}"/>
                        <div class="dialog-buttons">
                            <button id="cancel">Cancel</button>
                            <button id="ok">OK</button>
                        </div>
                    </div>
                `
            })

            const input = win.el.content.querySelector('input')!
            const ok = win.el.content.querySelector('#ok') as HTMLElement;
            const cancel = win.el.content.querySelector('#cancel') as HTMLElement;

            input.focus()
            input.select()

            ok.onclick = () => {
                resolve(input.value)
                win.close()
            }
            cancel.onclick = () => {
                resolve(null)
                win.close()
            }
            input.onkeydown = (e) => {
                if (e.key === 'Enter') ok.click()
                if (e.key === 'Escape') cancel.click()
            }
        })
    }

    private async loadMounts() {
        const mountsEl = document.getElementById('mounts')!
        mountsEl.innerHTML = ''

        for (const [path] of this.fs.mounts) {
            const mountEl = document.createElement('div')
            mountEl.className = 'mount-item'
            mountEl.textContent = path
            mountEl.onclick = () => this.loadPath(path)
            mountsEl.appendChild(mountEl)
        }
    }

    private async mount() {
        const path = await this.showDialog('Mount Path', '/mnt/name')
        if (path) {
            await this.fs.mount(path)
            this.loadMounts()
        }
    }

    private async loadPath(path: string) {
        try {
            const files = await this.fs.list(path)
            const container = document.getElementById('file-container')!
            container.className = `file-container ${this.viewMode}`
            container.innerHTML = ''

            const stats = await Promise.all(
                files.map(f => this.fs.stat(`${path}/${f.name}`))
            )

            stats.sort((a, b) => {
                if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name)
                return a.isDirectory ? -1 : 1
            }).forEach(stat => this.createFileElement(stat, container))

            this.currentPath = path
                ; (document.getElementById('path-input') as HTMLInputElement).value = path

            if (this.history[this.historyPos] !== path) {
                this.history = this.history.slice(0, this.historyPos + 1)
                this.history.push(path)
                this.historyPos++
            }
        } catch (err) {
            console.error(err)
        }
    }

    private createFileElement(stat: FileStats, container: HTMLElement) {
        const el = document.createElement('div')
        el.className = `file-item ${this.viewMode} ${this.selectedItems.has(stat.name) ? 'selected' : ''}`

        el.innerHTML = `
            <div class="file-icon">
                <i class="icon ${stat.isDirectory ? 'folder' : 'file'}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${stat.name}</div>
                <div class="file-details">
                    ${stat.isFile ? this.formatSize(stat.size) : '--'}
                    <span class="separator">•</span>
                    ${this.formatDate(stat.lastModified)}
                </div>
            </div>
        `

        el.onclick = (e) => {
            if (e.ctrlKey) {
                this.toggleSelection(stat.name)
            } else {
                this.selectedItems.clear()
                this.handleFileClick(stat)
            }
        }

        el.oncontextmenu = (e) => {
            e.preventDefault()
            if (!this.selectedItems.has(stat.name)) {
                this.selectedItems.clear()
                this.toggleSelection(stat.name)
            }
            this.cm.closeMenu()
            this.cm.renderMenu(
                e.clientX,
                e.clientY,
                this.selectedItems.size ? 'explorer-selected' : 'explorer'
            )
        }

        container.appendChild(el)
    }

    private toggleSelection(name: string) {
        if (this.selectedItems.has(name)) {
            this.selectedItems.delete(name)
        } else {
            this.selectedItems.add(name)
        }
        this.loadPath(this.currentPath)
    }

    private async handleFileClick(stat: FileStats) {
        if (stat.isDirectory) {
            await this.loadPath(`${this.currentPath}/${stat.name}`)
        } else {
            await this.fs.download(`${this.currentPath}/${stat.name}`)
        }
    }

    private navigate(direction: 'back' | 'forward' | 'up') {
        if (direction === 'back' && this.historyPos > 0) {
            this.historyPos--
            this.loadPath(this.history[this.historyPos])
        } else if (direction === 'forward' && this.historyPos < this.history.length - 1) {
            this.historyPos++
            this.loadPath(this.history[this.historyPos])
        } else if (direction === 'up') {
            const upPath = this.currentPath.split('/').slice(0, -1).join('/') || '/'
            this.loadPath(upPath)
        }
    }

    private async handleSearch(query: string) {
        if (!query) {
            this.loadPath(this.currentPath)
            return
        }

        const files = await this.fs.list(this.currentPath, true)
        const filtered = files.filter(f =>
            f.name.toLowerCase().includes(query.toLowerCase())
        )

        const container = document.getElementById('file-container')!
        container.innerHTML = ''

        const stats = await Promise.all(
            filtered.map(f => this.fs.stat(`${this.currentPath}/${f.name}`))
        )

        stats.forEach(stat => this.createFileElement(stat, container))
    }
}

new FileExplorer()