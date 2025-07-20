export class ContextMenuTest {

	constructor() {
		this.createTestElements();
		this.setupTestMenus();
	}

	private createTestElements(): void {
		const container = document.createElement('div');
		container.style.cssText = `
			position: fixed;
			top: 50px;
			left: 50px;
			display: flex;
			flex-direction: column;
			gap: 20px;
			z-index: 1000;
		`;

		// Test element 1: Basic menu
		const test1 = document.createElement('div');
		test1.id = 'test-basic';
		test1.textContent = 'Right-click: Basic Menu';
		test1.style.cssText = `
			padding: 10px;
			background: rgba(30, 30, 46, 0.8);
			color: white;
			border-radius: 8px;
			cursor: pointer;
		`;

		// Test element 2: Toggle menu
		const test2 = document.createElement('div');
		test2.id = 'test-toggle';
		test2.textContent = 'Right-click: Toggle Menu';
		test2.style.cssText = `
			padding: 10px;
			background: rgba(30, 30, 46, 0.8);
			color: white;
			border-radius: 8px;
			cursor: pointer;
		`;

		// Test element 3: Folder menu
		const test3 = document.createElement('div');
		test3.id = 'test-folder';
		test3.textContent = 'Right-click: Folder Menu';
		test3.style.cssText = `
			padding: 10px;
			background: rgba(30, 30, 46, 0.8);
			color: white;
			border-radius: 8px;
			cursor: pointer;
		`;

		// Test element 4: Complex menu
		const test4 = document.createElement('div');
		test4.id = 'test-complex';
		test4.textContent = 'Right-click: Complex Menu';
		test4.style.cssText = `
			padding: 10px;
			background: rgba(30, 30, 46, 0.8);
			color: white;
			border-radius: 8px;
			cursor: pointer;
		`;

		container.appendChild(test1);
		container.appendChild(test2);
		container.appendChild(test3);
		container.appendChild(test4);
		document.body.appendChild(container);
	}

	private setupTestMenus(): void {
		// Basic menu
		window.xen.ui.contextMenu.attach('test-basic', {
			root: [
				{
					title: 'Copy',
					icon: './assets/icons/copy.png',
					onClick: () => console.log('Copy clicked')
				},
				{
					title: 'Paste',
					icon: './assets/icons/paste.png',
					onClick: () => console.log('Paste clicked')
				},
				{
					title: 'Delete',
					onClick: () => console.log('Delete clicked')
				}
			]
		});

		// Toggle menu
		let toggleState = false;
		window.xen.ui.contextMenu.attach('test-toggle', {
			root: [
				{
					title: 'Toggle Option',
					toggle: toggleState,
					onClick: () => {
						toggleState = !toggleState;
						console.log('Toggle state:', toggleState);
						// Re-attach with new state
						window.xen.ui.contextMenu.attach('test-toggle', {
							root: [
								{
									title: 'Toggle Option',
									toggle: toggleState,
									onClick: () => {
										toggleState = !toggleState;
										console.log('Toggle state:', toggleState);
									}
								}
							]
						});
					}
				},
				{
					title: 'Another Toggle',
					toggle: true,
					onClick: () => console.log('Another toggle clicked')
				}
			]
		});

		// Folder menu
		window.xen.ui.contextMenu.attach('test-folder', {
			root: [
				{
					title: 'Open',
					onClick: () => console.log('Open clicked')
				}
			],
			'New': [
				{
					title: 'Folder',
					icon: './assets/icons/folder.png',
					onClick: () => console.log('New folder')
				},
				{
					title: 'Document',
					icon: './assets/icons/document.png',
					onClick: () => console.log('New document')
				}
			],
			'Edit': [
				{
					title: 'Cut',
					onClick: () => console.log('Cut')
				},
				{
					title: 'Copy',
					onClick: () => console.log('Copy')
				}
			]
		});

		// Complex menu
		window.xen.ui.contextMenu.attach('test-complex', {
			root: [
				{
					title: 'Pin to Dock',
					toggle: false,
					icon: './assets/icons/pin.png',
					onClick: () => console.log('Pin toggled')
				},
				{
					title: 'Close Window',
					onClick: () => console.log('Window closed')
				}
			],
			'View': [
				{
					title: 'Large Icons',
					toggle: true,
					onClick: () => console.log('Large icons')
				},
				{
					title: 'Small Icons',
					toggle: false,
					onClick: () => console.log('Small icons')
				}
			],
			'Sort by': [
				{
					title: 'Name',
					toggle: true,
					onClick: () => console.log('Sort by name')
				},
				{
					title: 'Date',
					toggle: false,
					onClick: () => console.log('Sort by date')
				}
			]
		});
	}

	public destroy(): void {
		const container = document.querySelector('[style*="position: fixed"]');
		if (container) {
			container.remove();
		}
	}
}