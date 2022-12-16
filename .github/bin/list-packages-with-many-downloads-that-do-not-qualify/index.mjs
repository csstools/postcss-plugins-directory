import fs from 'fs/promises';
import path from 'path';

const maintainedPlugins = new Set(JSON.parse(await fs.readFile('./npm-data/maintained-plugins.json')).objects.map((x) => x.package.name));

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
	if ('_downloads' in pluginData && pluginData._downloads < 1000_000) {
		continue;
	}

	console.log(plugin.package.name, pluginData._downloads);
}
