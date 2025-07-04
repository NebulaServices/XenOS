// TODO: Animation for spawning notifications
interface NotificationOpts {
    title: string;
    body: string;
    icon?: string;
    timeout?: number;
};

export class Notifications {
    private container: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    spawn(opts: NotificationOpts) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const content = `
            <div class="notification-header">
                ${opts.icon ? `<img src="${opts.icon}" class="notification-icon"/>` : ''}
                <span class="notification-title">${opts.title}</span>
                <button class="notification-close">×</button>
            </div>
            <div class="notification-body">${opts.body}</div>
            <div class="notification-progress"><div class="progress-bar"></div></div>
        `;
        notification.innerHTML = content;
        this.container.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        const timeout = (opts.timeout || 2) * 1000;
        const progressBar = notification.querySelector('.progress-bar') as HTMLElement;
        if (progressBar) {
            progressBar.style.animationDuration = `${timeout}ms`;
        }
        
        const close = () => {
            notification.classList.remove('show')
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }

        notification.querySelector('.notification-close')?.addEventListener('click', close);
        setTimeout(close, timeout);
    }
}