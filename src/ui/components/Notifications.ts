interface NotificationOpts {
    title: string;
    description: string;
    icon?: string;
    image?: string | ArrayBuffer;
    timeout?: number;
    onClick?: () => void;
}

export class Notifications {
    private container: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    spawn(opts: NotificationOpts) {
        if ((window as any).xen?.settings?.get('dnd') === true) {
            return;
        }

        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const iconHtml = opts.icon 
            ? `<img src="${opts.icon}" class="notification-icon" alt=""/>` 
            : '';
        
        const imageHtml = opts.image 
            ? `<div class="notification-image">
                 <img src="${typeof opts.image === 'string' ? opts.image : URL.createObjectURL(new Blob([opts.image]))}" alt=""/>
               </div>` 
            : '';
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    ${iconHtml}
                    <div class="notification-text">
                        <div class="notification-title">${opts.title}</div>
                        <div class="notification-description">${opts.description}</div>
                    </div>
                    <button class="notification-close">×</button>
                </div>
                ${imageHtml}
            </div>
            <div class="notification-progress">
                <div class="progress-bar"></div>
            </div>
        `;

        this.container.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        const timeout = opts.timeout || 5000;
        const progressBar = notification.querySelector('.progress-bar') as HTMLElement;
        
        setTimeout(() => {
            if (progressBar) {
                progressBar.style.animationDuration = `${timeout}ms`;
                progressBar.classList.add('animate');
            }
        }, 400);
        
        const close = () => {
            notification.classList.add('closing');
            setTimeout(() => notification.remove(), 300);
        };

        if (opts.onClick) {
            notification.addEventListener('click', (e) => {
                if (!(e.target as Element).closest('.notification-close')) {
                    opts.onClick!();
                    close();
                }
            });
            notification.style.cursor = 'pointer';
        }

        notification.querySelector('.notification-close')?.addEventListener('click', (e) => {
            e.stopPropagation();
            close();
        });
        
        setTimeout(close, timeout);
    }
}