import { repoHandler } from '../policy/handler';

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

		const defaultRepos: RepoSettingsStore[] = [
			{
				url: 'https://repos.xen-os.dev/apps/',
				type: 'xen',
			},
			{
				url: 'https://repos.xen-os.dev/webapps/',
				type: 'xen',
			},
			{
				url: 'https://repos.xen-os.dev/games/',
				type: 'xen',
			},
			{
				url: 'https://games.anura.pro',
				type: 'anura',
			},
			{
				url: 'https://xen-repos.scaratek.dev',
				type: 'xen'
			}
		];

		if (!this.repos) {
			this.repos = [];
		}

		for (const dRepo of defaultRepos) {
			if (!this.repos.some((repo) => repo.url === dRepo.url)) {
				this.repos.push(dRepo);
			}
		}

		window.xen.settings.set('repos', this.repos);
	}

	addRepo(url: string, type: 'xen' | 'anura'): void {
		if (!repoHandler(new URL(url))) {
			window.xen.notifications.spawn({
				title: 'XenOS',
				description: `The repo URL ${url} is blocked by your policies`,
				icon: '/assets/logo.svg',
				timeout: 2500,
			});

			return;
		}
		if (this.repos.some((repo) => repo.url === url)) {
			throw new Error(`Repository ${url} already exists`);
		}

		this.repos.push({ url, type });
		window.xen.settings.set('repos', this.repos);
	}

	removeRepo(url: string): void {
		const index = this.repos.findIndex((repo) => repo.url === url);

		if (index === -1) {
			throw new Error(`Repository ${url} not found`);
		}

		this.repos.splice(index, 1);
		window.xen.settings.set('repos', this.repos);
	}

	async getManifest(repoUrl: string) {
		const fUrl = new URL('manifest.json', repoUrl).href;
		return await (await window.xen.net.fetch(fUrl)).json();
	}

	async listPackages(repoUrl: string, type: 'xen' | 'anura') {
		if (type === 'xen') {
			const manifest: RepoManifest = await this.getManifest(repoUrl);
			return manifest.packages;
		} else if (type === 'anura') {
			const fUrl = new URL('list.json', repoUrl).href;
			return await (await window.xen.net.fetch(fUrl)).json();
		}
	}

	async getPackage(repoUrl: string, id: string): Promise<PackageManifest> {
		const url = new URL(`packages/${id}/manifest.json`, repoUrl).href;
		return await (await window.xen.net.fetch(url)).json();
	}

	async install(
		repoUrl: string,
		id: string,
		type: 'xen' | 'anura',
		anura?: 'id' | 'name',
	) {
		if (type === 'xen') {
			await window.xen.packages.install(
				'url',
				window.xen.net.encodeUrl(
					new URL(`packages/${id}/package.zip`, repoUrl).href,
				),
			);
		} else if (type === 'anura') {
			const packages = await this.listPackages(repoUrl, 'anura');
			let match;

			if (anura == 'id') {
				match = [...(packages.apps ?? []), ...(packages.libs ?? [])].find(
					(pkg) => pkg.package === id,
				);
			} else if (anura == 'name') {
				match = [...(packages.apps ?? []), ...(packages.libs ?? [])].find(
					(pkg) => pkg.name === id,
				);
			}

			if (!match) {
				throw new Error(`Package with id/name ${id} not found in Anura repo`);
			}

			const url = new URL(match.data, repoUrl).href;

			await window.xen.packages.anuraInstall(
				'url',
				window.xen.net.encodeUrl(url),
			);
		}
	}
}