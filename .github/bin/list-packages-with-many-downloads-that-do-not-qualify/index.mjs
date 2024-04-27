import fs from 'fs/promises';
import path from 'path';
import { NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH } from '../../../cmd/tasks/constants.mjs';

// NOTE : this is WIP.
// It is interesting to analyze packages that do not qualify.
// This script lists packages with high download counts.

const maintainedPlugins = new Set(JSON.parse(await fs.readFile(NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH)).objects.map((x) => x.package.name));

const excluded = [];

const pluginsList = {
	objects: [
		...JSON.parse(await fs.readFile('./npm-data/plugins.json')).objects,
		// ...JSON.parse(await fs.readFile('./npm-data/maybe-plugins.json')).objects,
	]
};
for (let i = 0; i < pluginsList.objects.length; i++) {
	const plugin = pluginsList.objects[i];
	if (maintainedPlugins.has(plugin.package.name)) {
		continue;
	}

	const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json';
	const pluginData = JSON.parse(await fs.readFile(pluginFilePath));
	if ('_downloads' in pluginData && pluginData._downloads < 100_000) {
		continue;
	}

	excluded.push({
		name: plugin.package.name,
		downloads: pluginData._downloads,
	});
}

excluded.sort((a, b) => b.downloads - a.downloads);

excluded.forEach((plugin) => {
	console.log(plugin.name, plugin.downloads);
});
