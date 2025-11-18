import fs from 'fs/promises';
import path from 'path';
import { fetchDownloadCount } from '../util/fetch-download-count.mjs';
import { fetchPlugin } from '../util/fetch-plugin.mjs';
import { shuffle } from '../util/shuffle.mjs';
import { NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH } from '../constants.mjs';
import { readJSONFromFileOrEmptyObject } from '../util/read-json.mjs';

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

	if (existingData._downloads) {
		if (Array.isArray(existingData._downloads)) {
			detailedData._downloads = [...existingData._downloads, downloadsData.downloads].slice(-20);
		} else {
			detailedData._downloads = [existingData._downloads, downloadsData.downloads];
		}
	} else {
		detailedData._downloads = [downloadsData.downloads];
	}

	await fs.mkdir(path.dirname(pluginFilePath), { recursive: true });
	await fs.writeFile(pluginFilePath, JSON.stringify(detailedData, null, '\t'));

	return true;
}

export async function fetchDetailedPluginData() {
	const fetched = new Set();
	const limit = 100;

	{
		let counter = 0;
		let i = 0;
		const pluginsList = JSON.parse(await fs.readFile('./npm-data/plugins.json'));
		const refreshList = shuffle(pluginsList.objects);
		while (counter < limit && i < refreshList.length) {
			const plugin = refreshList[i];
			i++;

			if (fetched.has(plugin.package.name)) {
				continue;
			}

			const didFetch = await fetchDetailedDataForOnePlugin(plugin, false, counter, limit);
			if (didFetch) {
				fetched.add(plugin.package.name);
				counter++
			}
		}
	}

	{
		let counter = 0;
		let i = 0;
		const pluginsList = JSON.parse(await fs.readFile('./npm-data/plugins.json'));
		const refreshList = shuffle(pluginsList.objects);
		while (counter < limit && i < refreshList.length) {
			const plugin = refreshList[i];
			i++;

			if (fetched.has(plugin.package.name)) {
				continue;
			}

			const didFetch = await fetchDetailedDataForOnePlugin(plugin, true, counter, limit);
			if (didFetch) {
				fetched.add(plugin.package.name);
				counter++
			}
		}
	}

	{
		let counter = 0;
		let i = 0;
		const pluginsList = JSON.parse(await fs.readFile(NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH));
		const refreshList = shuffle(pluginsList.objects);
		while (counter < limit && i < refreshList.length) {
			const plugin = refreshList[i];
			i++;

			if (fetched.has(plugin.package.name)) {
				continue;
			}

			const didFetch = await fetchDetailedDataForOnePlugin(plugin, true, counter, limit);
			if (didFetch) {
				fetched.add(plugin.package.name);
				counter++
			}
		}
	}
}
