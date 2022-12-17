import fs from 'fs/promises';
import path from 'path';
import { fetchDownloadCount } from '../util/fetch-download-count.mjs';
import { fetchPlugin } from '../util/fetch-plugin.mjs';
import { shuffle } from '../util/shuffle.mjs';

async function readJSONFromFileOrEmptyObject(path) {
	try {
		return JSON.parse(await fs.readFile(path));
	} catch (_) {
		return {};
	}
}

async function fetchDetailedDataForOnePlugin(plugin, forced, index, total) {
	const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json';

	const existingData = await readJSONFromFileOrEmptyObject(pluginFilePath);
	const times = new Set(Object.values(existingData?.time ?? {}));
	if (!forced && times.has(plugin.package.date) && existingData._downloads) {
		return false;
	}

	console.log(`processing ${index + 1}/${total}`, pluginFilePath);
	const detailedData = await fetchPlugin(plugin.package.name);
	const downloadsData = await fetchDownloadCount(plugin.package.name);

	if (existingData._downloads && existingData._downloads > 50 && downloadsData.downloads < 50) {
		// Some plugins might oscillate around 50.
		// If a plugin drops from above 50 to under 50 we set it to exactly 50.
		detailedData._downloads = 50;
	} else {
		detailedData._downloads = downloadsData.downloads;
	}

	await fs.mkdir(path.dirname(pluginFilePath), { recursive: true });
	await fs.writeFile(pluginFilePath, JSON.stringify(detailedData, null, '\t'));

	return true;
}

export async function fetchDetailedPluginData() {
	let counter = 0;
	const pluginsList = JSON.parse(await fs.readFile('./npm-data/plugins.json'));
	for (let i = 0; i < pluginsList.objects.length; i++) {
		const plugin = pluginsList.objects[i];
		const didFetch = await fetchDetailedDataForOnePlugin(plugin, false, i, pluginsList.objects.length);
		if (didFetch) {
			counter++;
		}
	}

	if (counter < 50) {
		const refreshList = shuffle(pluginsList.objects).slice(0, 50);
		for (let i = 0; i < refreshList.length; i++) {
			const plugin = refreshList[i];
			const didFetch = await fetchDetailedDataForOnePlugin(plugin, true, i, refreshList.length);
			if (didFetch) {
				counter++
			}
		}
	}
}
