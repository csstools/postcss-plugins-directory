import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';

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

	await fs.writeFile(lastVersionFilePath, updatedData)

	if (process.env.GITHUB_ACTIONS) {
		let packageName = plugin.package.name
		if (packageName.startsWith('@')) {
			packageName = packageName.slice(1)
		}

		process.stdout.write(`${packageName}-${lastVersion}`)
	}

	break;
}
