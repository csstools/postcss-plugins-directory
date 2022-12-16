import fs from 'fs/promises';

const seen = new Set();
const pluginsList = JSON.parse(await fs.readFile('./npm-data/plugins.json'));
for (let i = 0; i < pluginsList.objects.length; i++) {
	const plugin = pluginsList.objects[i];
	seen.add(plugin.package.name);
}

async function fetchPackages(offset) {
	const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=postcss&from=${offset}&size=250`);
	if (response.status !== 200) {
		throw new Error(`Fetching packages : ${response.statusText}`);
	}

	return await response.json();
}

const result = {
	objects: []
};

{
	const batch = await fetchPackages(0);
	result.total = batch.total;

	for (let i = 0; i < batch.objects.length; i++) {
		const plugin = batch.objects[i];
		if (seen.has(plugin.package.name)) {
			continue;
		}

		seen.add(plugin.package.name);
		result.objects.push(plugin);
	}
}

const remainingPages = Math.ceil(result.total / 250);
for (let i = 1; i < remainingPages; i++) {
	const batch = await fetchPackages(i * 250);

	for (let j = 0; j < batch.objects.length; j++) {
		const plugin = batch.objects[j];
		if (seen.has(plugin.package.name)) {
			continue;
		}

		seen.add(plugin.package.name);
		result.objects.push(plugin);
	}
}

result.objects.sort((a, b) => {
	if (a.package.name !== b.package.name) {
		return a.package.name.localeCompare(b.package.name);
	}

	if (a.package.scope !== b.package.scope) {
		return a.package.scope.localeCompare(b.package.scope);
	}

	return 0;
});

result.objects.forEach((x) => {
	delete x.score;
	delete x.searchScore;
});

delete result.time;
await fs.writeFile('./npm-data/maybe-plugins.json', JSON.stringify(result, null, '\t'));
