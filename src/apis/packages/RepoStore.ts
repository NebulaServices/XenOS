// import { repoHandler } from "../policy/handler";

interface Maintainer {
	name?: string;
	email?: string;
	website?: string;
	repo?: string;
}

interface RepoManifest {
	title: string;
	description: string;
	version: string;
	maintainer?: Maintainer;
	packages: string[];
}

interface PackageManifest {
	name: string;
	description: string;
	type: 'app' | 'lib';
	version: string;
	icon: string;
	maintainer?: Maintainer;
}

interface RepoSettingsStore {
	url: string;
	type: 'xen' | 'anura';
}

export class RepoStore {
	private repos: RepoSettingsStore[];

	init() {
		this.repos = window.xen.settings.get('repos');

		if (!this.repos) {
			this.repos = [
				{
					url: 'https://scaratech.github.io',
					type: 'xen'
				},
				{
					url: 'https://games.anura.pro',
					type: 'anura'
				}
			];

			window.xen.settings.set('repos', this.repos);
		}
	}

	addRepo(url: string, type: 'xen' | 'anura'): void {
		if (this.repos.some(repo => repo.url === url)) {
			throw new Error(`Repository ${url} already exists`);
		}

		this.repos.push({ url, type });
		window.xen.settings.set('repos', this.repos);
	}

	removeRepo(url: string): void {
		const index = this.repos.findIndex(repo => repo.url === url);

		if (index === -1) {
			throw new Error(`Repository ${url} not found`);
		}

		this.repos.splice(index, 1);
		window.xen.settings.set('repos', this.repos);
	}

	async getManifest(url: string) {
		const fUrl = new URL(
			'/manifest.json',
			new URL(url).origin
		).href;

		return await (await window.xen.net.fetch(fUrl)).json();
	}

	async listPackages(repo: string, type: 'xen' | 'anura') {
		if (type === 'xen') {
			const manifest: RepoManifest = await this.getManifest(repo);
			return manifest.packages;
		} else if (type === 'anura') {
			const fUrl = new URL(
				'/list.json',
				new URL(repo).origin
			).href;

			return await (await window.xen.net.fetch(fUrl)).json();
		}
	}

	async getPackage(repo: string, id: string): Promise<PackageManifest> {
		const url = new URL(
			`/packages/${id}/manifest.json`,
			new URL(repo).origin
		).href;

		return await (await window.xen.net.fetch(url)).json();
	}

	async install(
		repo: string, 
		id: string,
		type: 'xen' | 'anura',
		anura?: 'id' | 'name'
	) {
		if (type === 'xen') {
			await window.xen.packages.install(
				'url',
				window.xen.net.encodeUrl(
					new URL(
						`/packages/${id}/package.zip`,
						new URL(repo).origin
					).href
				)
			);
		} else if (type === 'anura') {
			const packages = await this.listPackages(repo, 'anura');
			let match;

			if (anura == 'id') {
				match = [...(packages.apps ?? []), ...(packages.libs ?? [])].find(
					(pkg) => pkg.package === id
				);
			} else if (anura == 'name') {
				match = [...(packages.apps ?? []), ...(packages.libs ?? [])].find(
					(pkg) => pkg.name === id
				);
			}

			const url = new URL(
				`/${match.data}`,
				new URL(repo).origin
			).href;

			await window.xen.ATL.package.install(
				'url',
				window.xen.net.encodeUrl(url)
			);
		}
	}
}