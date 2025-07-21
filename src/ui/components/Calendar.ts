export class Calendar {
    private el: {
        calendar: HTMLDivElement;
        header: HTMLDivElement;
        monthYear: HTMLDivElement;
        prevBtn: HTMLButtonElement;
        nextBtn: HTMLButtonElement;
        daysGrid: HTMLDivElement;
        weekdays: HTMLDivElement;
    } = {} as any;

    private isVisible: boolean = false;
    private currentDate: Date = new Date();
    private today: Date = new Date();

    constructor() {
        this.setupEls();
        this.attachListeners();
    }

    private setupEls(): void {
        this.el.calendar = document.createElement('div');
        this.el.calendar.classList.add('calendar-popup');
        this.el.calendar.style.display = 'none';

        this.el.header = document.createElement('div');
        this.el.header.classList.add('calendar-header');

        this.el.prevBtn = document.createElement('button');
        this.el.prevBtn.classList.add('calendar-nav-btn');
        this.el.prevBtn.innerHTML = '‹';

        this.el.monthYear = document.createElement('div');
        this.el.monthYear.classList.add('calendar-month-year');

        this.el.nextBtn = document.createElement('button');
        this.el.nextBtn.classList.add('calendar-nav-btn');
        this.el.nextBtn.innerHTML = '›';

        this.el.weekdays = document.createElement('div');
        this.el.weekdays.classList.add('calendar-weekdays');
        this.el.weekdays.innerHTML = `
        <div class="calendar-weekday">Sun</div>
        <div class="calendar-weekday">Mon</div>
        <div class="calendar-weekday">Tue</div>
        <div class="calendar-weekday">Wed</div>
        <div class="calendar-weekday">Thu</div>
        <div class="calendar-weekday">Fri</div>
        <div class="calendar-weekday">Sat</div>
    `;

        this.el.daysGrid = document.createElement('div');
        this.el.daysGrid.classList.add('calendar-days');

        this.el.header.appendChild(this.el.prevBtn);
        this.el.header.appendChild(this.el.monthYear);
        this.el.header.appendChild(this.el.nextBtn);

        this.el.calendar.appendChild(this.el.header);
        this.el.calendar.appendChild(this.el.weekdays);
        this.el.calendar.appendChild(this.el.daysGrid);
    }

    private attachListeners(): void {
        this.el.prevBtn.addEventListener('click', () => this.prevMonth());
        this.el.nextBtn.addEventListener('click', () => this.nextMonth());

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!this.el.calendar.contains(target) &&
                !target.closest('.time-module')) {
                this.hide();
            }
        });
    }

    private prevMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    private nextMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    private render(): void {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        this.el.monthYear.textContent = `${this.currentDate.toLocaleDateString([], {
            month: 'long',
            year: 'numeric'
        })}`;

        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        this.el.daysGrid.innerHTML = '';

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.textContent = date.getDate().toString();

            if (date.getMonth() !== month) {
                dayEl.classList.add('other-month');
            }

            if (date.toDateString() === this.today.toDateString()) {
                dayEl.classList.add('today');
            }

            this.el.daysGrid.appendChild(dayEl);
        }
    }

    public toggle(anchor: HTMLElement): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show(anchor);
        }
    }

    private show(anchor: HTMLElement): void {
        this.currentDate = new Date();
        this.render();

        const rect = anchor.getBoundingClientRect();

        this.el.calendar.style.position = 'fixed';
        this.el.calendar.style.right = `${window.innerWidth - rect.right}px`;
        this.el.calendar.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        this.el.calendar.style.display = 'block';

        requestAnimationFrame(() => {
            this.el.calendar.classList.add('show');
        });

        this.isVisible = true;
    }

    private hide(): void {
        this.el.calendar.classList.remove('show');
        setTimeout(() => {
            this.el.calendar.style.display = 'none';
        }, 200);
        this.isVisible = false;
    }

    public create(): void {
        document.body.appendChild(this.el.calendar);
    }
}