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

	const lastVersionData = pluginData.versions[versions[versions.length - 1]];
	const time = pluginData.time[versions[versions.length - 1]];
	lastVersionData._time = time

	const lastVersionFilePath = path.join('npm-data', 'last-version', plugin.package.name) + '.json'
	await fs.mkdir(path.dirname(lastVersionFilePath), { recursive: true })
	await fs.writeFile(lastVersionFilePath, JSON.stringify(lastVersionData, null, '\t'))
}
