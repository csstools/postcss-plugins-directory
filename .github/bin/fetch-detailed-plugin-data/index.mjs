import fs from 'fs/promises';
import path from 'path';

async function fetchPlugin(name) {
	const response = await fetch(`https://registry.npmjs.org/${name}`)
	if (response.status !== 200) {
		throw new Error(`Fetching detailed plugin data : ${response.statusText}`);
	}

	return await response.json()
}

async function fetchDownloadCount(name) {
	const response = await fetch(`https://api.npmjs.org/downloads/point/last-month/${name}`)
	if (response.status !== 200) {
		return {
			downloads: 0
		}
	}

	return await response.json()
}

async function readJSONFromFileOrEmptyObject(path) {
	try {
		return JSON.parse(await fs.readFile(path))
	} catch (_) {
		return {}
	}
}

const pluginsList = JSON.parse(await fs.readFile('./npm-data/plugins.json'));
for (let i = 0; i < pluginsList.objects.length; i++) {
	const plugin = pluginsList.objects[i];
	const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json'

	const existingData = await readJSONFromFileOrEmptyObject(pluginFilePath)
	const times = new Set(Object.values(existingData?.time ?? {}))
	if (times.has(plugin.package.date) && existingData._downloads) {
		continue;
	}

	console.log(`processing ${i + 1}/${pluginsList.objects.length}`, pluginFilePath);
	const detailedData = await fetchPlugin(plugin.package.name)
	const downloadsData = await fetchDownloadCount(plugin.package.name)
	detailedData._downloads = downloadsData.downloads

	await fs.mkdir(path.dirname(pluginFilePath), { recursive: true })
	await fs.writeFile(pluginFilePath, JSON.stringify(detailedData, null, '\t'))
}
