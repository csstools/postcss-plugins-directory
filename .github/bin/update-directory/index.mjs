import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';

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

	const response = await fetch(
		`https://api.github.com/repos/romainmenke/postcss-plugins-directory/pulls?per_page=100&page=${page}`,
		{
			method: 'GET',
			headers: headers,
		}
	);

	if (!response.status || (Math.floor(response.status / 100) !== 2)) {
		throw new Error(`Unepected response code "${response.status}" with message "${response.statusText}"`);
	}

	const data = await response.json();

	return data.map((x) => {
		if (!x.head.ref.startsWith('update-directory/')) {
			return false;
		}

		return x.head.ref.slice(17);
	}).filter((x) => !!x);
}

const existingUpdates = await listAllPullRequests();

async function traverseDir(dir) {
	const out = [];

	const files = await fs.readdir(dir);
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		let fullPath = path.join(dir, file);
		if ((await fs.lstat(fullPath)).isDirectory()) {
			out.push(...(await traverseDir(fullPath)));
		} else {
			out.push(fullPath);
		}
	}

	return out;
}

{
	const pluginDataFiles = await traverseDir('./directory');
	const pluginsSet = new Set(JSON.parse(await fs.readFile('./npm-data/maintained-plugins.json')).objects.map((plugin) => {
		return path.join('directory', plugin.package.name) + '.json';
	}));

	for (let i = 0; i < pluginDataFiles.length; i++) {
		const pluginDataFile = pluginDataFiles[i];
		if (!pluginsSet.has(pluginDataFile)) {
			await fs.rm(pluginDataFile);
		}
	}
}

const pluginsList = JSON.parse(await fs.readFile('./npm-data/maintained-plugins.json'));
for (let i = 0; i < pluginsList.objects.length; i++) {
	const plugin = pluginsList.objects[i];
	const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json';
	const pluginData = JSON.parse(await fs.readFile(pluginFilePath));
	const versions = Object.keys(pluginData.versions).filter((x) => {
		if (pluginData.versions[x].flags?.unstable === true) {
			return false;
		}

		if (semver.prerelease(x)) {
			return false;
		}

		if (!semver.gte(x, '1.0.0')) {
			return false;
		}

		return true;
	})

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

	await fs.writeFile(directoryFilePath, updatedData);

	if (process.env.GITHUB_ACTIONS) {
		process.stdout.write(updateName);
	}

	break;
}
