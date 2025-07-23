interface DialogOptions {
    title?: string;
    body?: string;
    icon?: string;
    placeholder?: string;
}

export class Dialog {
    private createDialog(
        opts: DialogOptions,
        type: 'alert' | 'confirm' | 'prompt',
    ): Promise<boolean | string | null> {
        return new Promise((resolve) => {
            const content = `
        <div class="dialog-content">
            <div class="dialog-header">
                ${opts.icon
                    ? `<img src="${opts.icon}" class="dialog-icon" />`
                    : ''
                }
                <div class="dialog-text">
                    <h3 class="dialog-title">${opts.title || 'Dialog'}</h3>
                    ${opts.body
                    ? `<p class="dialog-body">${opts.body}</p>`
                    : ''
                }
                </div>
            </div>
            ${type === 'prompt'
                    ? `
                <div class="dialog-input-container">
                    <input type="text" class="dialog-input" placeholder="${opts.placeholder || ''
                    }" />
                </div>
            `
                    : ''
                }
            <div class="dialog-actions">
                ${type !== 'alert'
                    ? `<button class="dialog-btn dialog-btn-cancel">Cancel</button>`
                    : ''
                }
                <button class="dialog-btn dialog-btn-ok">OK</button>
            </div>
        </div>
        <style>
            @import url('/styles/dialog.css');
        </style>
      `;

            const win = window.xen.wm.create({
                title: 'Dialog',
                icon: '/assets/logo.svg',
                width: 'auto',
                height: 'auto',
                content,
                resizable: false,
            });

            const okBtn = win.el.window.querySelector('.dialog-btn-ok');
            const cancelBtn = win.el.window.querySelector('.dialog-btn-cancel');
            const inputEl = win.el.window.querySelector(
                '.dialog-input',
            ) as HTMLInputElement;
            let resolved = false;
            const closeResolve = (value: string | boolean | null) => {
                if (resolved) return;
                resolved = true;

                win.close = ogClose;
                win.close();

                resolve(value);
            };

            const ogClose = win.close.bind(win);
            win.close = () => closeResolve(type === 'confirm' ? false : null);

            okBtn?.addEventListener('click', () => {
                const value = type === 'prompt' ? inputEl.value : true;
                closeResolve(value);
            });

            cancelBtn?.addEventListener('click', () => {
                const value = type === 'confirm' ? false : null;
                closeResolve(value);
            });

            if (inputEl) {
                setTimeout(() => inputEl.focus(), 50);
            }
        });
    }

    alert(opts: DialogOptions): Promise<void> {
        return this.createDialog(opts, 'alert') as Promise<any>;
    }

    confirm(opts: DialogOptions): Promise<boolean> {
        return this.createDialog(opts, 'confirm') as Promise<boolean>;
    }

    prompt(opts: DialogOptions): Promise<string | null> {
        return this.createDialog(opts, 'prompt') as Promise<string | null>;
    }
}