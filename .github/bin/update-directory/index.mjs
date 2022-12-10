import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import https from 'https';

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
	return await (new Promise((resolve, reject) => {
		const headers = {
			'User-Agent': 'GitHub Workflow'
		}

		if (process.env.GITHUB_TOKEN) {
			headers['authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
		}

		https.get({
			host: 'api.github.com',
			port: 443,
			path: `/repos/romainmenke/postcss-plugins-directory/pulls?per_page=100&page=${page}`,
			method: 'GET',
			headers: headers
		}, (res) => {
			if (!res.statusCode || (Math.floor(res.statusCode / 100) !== 2)) {
				throw new Error(`Unepected response code "${res.statusCode}" with message "${res.statusMessage}"`)
			}

			let data = [];
			res.on('data', (chunk) => {
				data.push(chunk);
			});

			res.on('end', () => {
				resolve(
					JSON.parse(Buffer.concat(data).toString()).map((x) => {
						if (!x.head.ref.startsWith('update-directory/')) {
							return false;
						}

						return x.head.ref.slice(17)
					}).filter((x) => !!x)
				);
			});

		}).on('error', (err) => {
			reject(err);
		});
	}));
}

const existingUpdates = await listAllPullRequests();

const pluginsList = JSON.parse(await fs.readFile('./npm-data/maintained-plugins.json'));
for (let i = 0; i < pluginsList.objects.length; i++) {
	const plugin = pluginsList.objects[i];
	const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json'
	const pluginData = JSON.parse(await fs.readFile(pluginFilePath))
	const versions = Object.keys(pluginData.versions).filter((x) => {
		if (pluginData.versions[x].flags?.unstable === true) {
			return false
		}

		if (semver.prerelease(x)) {
			return false
		}

		if (!semver.gte(x, '1.0.0')) {
			return false
		}

		return true
	})

	if (!versions.length) {
		continue;
	}

	versions.sort((a, b) => {
		return semver.compareLoose(a, b)
	})

	const lastVersion = versions[versions.length - 1];
	const lastVersionData = pluginData.versions[lastVersion];
	const time = pluginData.time[lastVersion];
	lastVersionData._time = time

	const lastVersionFilePath = path.join('directory', plugin.package.name) + '.json'
	await fs.mkdir(path.dirname(lastVersionFilePath), { recursive: true })
	const updatedData = JSON.stringify(lastVersionData, null, '\t');

	try {
		const existingData = await fs.readFile(lastVersionFilePath)
		if (existingData.toString() === updatedData.toString()) {
			continue;
		}
	} catch (_) {
		// noop
	}

	let packageName = plugin.package.name
	if (packageName.startsWith('@')) {
		packageName = packageName.slice(1)
	}

	const updateName = `${packageName}-${lastVersion}`;
	if (existingUpdates.has(updateName)) {
		continue
	}

	await fs.writeFile(lastVersionFilePath, updatedData)

	if (process.env.GITHUB_ACTIONS) {
		process.stdout.write(updateName)
	}

	break;
}
