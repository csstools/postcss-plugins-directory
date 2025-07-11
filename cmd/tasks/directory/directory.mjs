import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import { NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH, NPM_DATA_MALICIOUS_PACKAGES_PATH, THIS_REPOSITORY } from '../constants.mjs';
import { filterVersions } from '../util/filter-versions.mjs';
import { traverseDir } from '../util/traverse-dir.mjs';

export async function listAllPullRequests() {
	const allPullRequests = [];

	let page = 1;

	while (true) {
		const newPullRequests = await getPullRequests(page);
		allPullRequests.push(...newPullRequests);
		page++

		if (newPullRequests.length < 100) {
			break;
		}
	}

	return new Set(allPullRequests);
}

async function getPullRequests(page) {
	const headers = {
		'User-Agent': 'GitHub Workflow'
	};

	if (process.env.GITHUB_TOKEN) {
		headers['authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
	}

	await new Promise((resolve) => setTimeout(resolve, 100));
	const response = await fetch(
		`https://api.github.com/repos/${THIS_REPOSITORY}/pulls?per_page=100&page=${page}`,
		{
			method: 'GET',
			headers: headers,
		}
	);

	if (!response.status || (Math.floor(response.status / 100) !== 2)) {
		throw new Error(`Unexpected response code "${response.status}" with message "${response.statusText}"`);
	}

	const data = await response.json();

	return data.map((x) => {
		if (!x.head.ref.startsWith('update-directory/')) {
			return false;
		}

		return x.head.ref.slice(17);
	}).filter((x) => !!x);
}

export async function updateTheDirectory() {

	const existingUpdates = await listAllPullRequests();

	const pluginsList = JSON.parse(await fs.readFile(NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH));
	const maliciousPackages = JSON.parse(await fs.readFile(NPM_DATA_MALICIOUS_PACKAGES_PATH));

	{
		const pluginDataFiles = await traverseDir('./directory');
		const pluginsSet = new Set(pluginsList.objects.map((plugin) => {
			return path.join('directory', plugin.package.name) + '.json';
		}));

		for (let i = 0; i < pluginDataFiles.length; i++) {
			const pluginDataFile = pluginDataFiles[i];
			if (!pluginsSet.has(pluginDataFile)) {
				await fs.rm(pluginDataFile);
			}
		}
	}

	for (let i = 0; i < pluginsList.objects.length; i++) {
		const plugin = pluginsList.objects[i];
		const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json';
		const pluginData = JSON.parse(await fs.readFile(pluginFilePath));
		const versions = Object.keys(pluginData.versions).filter(filterVersions(pluginData));

		if (!versions.length) {
			continue;
		}

		versions.sort((a, b) => {
			return semver.compareLoose(a, b);
		});

		const lastVersion = versions[versions.length - 1];
		const lastVersionData = pluginData.versions[lastVersion];
		const time = pluginData.time[lastVersion];
		lastVersionData._time = time;

		const directoryFilePath = path.join('directory', plugin.package.name) + '.json';
		await fs.mkdir(path.dirname(directoryFilePath), { recursive: true });
		const updatedData = JSON.stringify(lastVersionData, null, '\t');

		try {
			const existingData = await fs.readFile(directoryFilePath);
			if (existingData.toString() === updatedData.toString()) {
				continue;
			}
		} catch (_) {
			// noop
		}

		let packageName = plugin.package.name;
		if (packageName.startsWith('@')) {
			packageName = packageName.slice(1);
		}

		const updateName = `${packageName}-${lastVersion}`;
		if (existingUpdates.has(updateName)) {
			continue
		}

		console.log(plugin.package.name, lastVersion);

		if (maliciousPackages[plugin.package.name]?.includes(lastVersion)) {
			continue
		}


		await fs.writeFile(directoryFilePath, updatedData);

		if (process.env.GITHUB_ACTIONS) {
			process.stdout.write(
				Buffer.from(JSON.stringify({
					updateName: updateName,
					packageName: plugin.package.name,
					version: lastVersion,
					description: plugin.package.description,
					keywords: plugin.package.keywords,
				})).toString('base64')
			);
		}

		break;
	}
}
