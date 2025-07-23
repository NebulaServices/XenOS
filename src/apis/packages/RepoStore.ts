import { repoHandler } from "../policy/handler";

interface Maintainer {
	name: string;
	email: string;
	website: string;
}

interface MonoManifest {
	title: string;
	description: string;
	version: string;
	type: 'mono';
	maintainer: Maintainer;
	repos: string[];
}

interface RepoManifest {
	title: string;
	description: string;
	version: string;
	type: 'repo';
	maintainer: Maintainer;
	packages: string[];
}

interface Screenshot {
	src: string;
	alt: string;
}

interface PackageManifest {
	name: string;
	description: string;
	type: 'app' | 'lib';
	version: string;
	icon: string;
	maintainer: Maintainer;
	tags: string[];
	screenshots: Screenshot[];
}

export class RepoStore {
	private base: string;

	constructor(base?: string) {
		if (base) {
			this.updateServer(base);
		}
	}

	async updateServer(base: string) {
		const obj = new URL(base);

		if (!await repoHandler(obj)) {
			window.xen.notifications.spawn({
				title: "XenOS",
				description: "This repository has been blocked by your policy and cannot be used",
				icon: "/assets/logo.svg",
				timeout: 2500
			});

			throw new Error('Repository URL blocked by policy');
		}

		this.base = new URL(base).origin;
	}

	async monoManifest(): Promise<MonoManifest> {
		const res = await window.xen.net.fetch(`${this.base}/manifest.json`);
		return res.json();
	}

	async repoManifest(repo: string): Promise<RepoManifest> {
		const res = await window.xen.net.fetch(`${this.base}/repos/${repo}/manifest.json`);
		return res.json();
	}

	async pkgManifest(repo: string, id: string): Promise<PackageManifest> {
		const res = await window.xen.net.fetch(`${this.base}/repos/${repo}/packages/${id}/manifest.json`);
		return res.json();
	}

	async install(repo: string, id: string): Promise<void> {
		const url = `${this.base}/repos/${repo}/packages/${id}/${id}.zip`;
		await window.xen.packages.install('url', window.xen.net.encodeUrl(url));
	}
}