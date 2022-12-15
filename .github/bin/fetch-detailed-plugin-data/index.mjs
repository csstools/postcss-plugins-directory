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

async function fetchDetailedPluginData(plugin, forced, index, total) {
	const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json'

	const existingData = await readJSONFromFileOrEmptyObject(pluginFilePath)
	const times = new Set(Object.values(existingData?.time ?? {}))
	if (!forced && times.has(plugin.package.date) && existingData._downloads) {
		return false;
	}

	console.log(`processing ${index + 1}/${total}`, pluginFilePath);
	const detailedData = await fetchPlugin(plugin.package.name)
	const downloadsData = await fetchDownloadCount(plugin.package.name)
	detailedData._downloads = downloadsData.downloads

	await fs.mkdir(path.dirname(pluginFilePath), { recursive: true })
	await fs.writeFile(pluginFilePath, JSON.stringify(detailedData, null, '\t'))

	return true;
}

function shuffle(array) {
	let currentIndex = array.length, randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {

		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
}

let counter = 0;
const pluginsList = JSON.parse(await fs.readFile('./npm-data/plugins.json'));
for (let i = 0; i < pluginsList.objects.length; i++) {
	const plugin = pluginsList.objects[i];
	const didFetch = await fetchDetailedPluginData(plugin, false, i, pluginsList.objects.length);
	if (didFetch) {
		counter++
	}
}

if (counter < 50) {
	const refreshList = shuffle(pluginsList.objects).slice(0, 50);
	for (let i = 0; i < refreshList.length; i++) {
		const plugin = refreshList[i];
		const didFetch = await fetchDetailedPluginData(plugin, true, i, refreshList.length);
		if (didFetch) {
			counter++
		}
	}
}
