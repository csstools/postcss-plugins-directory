import fs from 'fs/promises';

const seen = new Set();

async function fetchPlugins(offset) {
	const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=keywords:postcss-plugin&from=${offset}&size=250`);
	if (response.status !== 200) {
		throw new Error(`Fetching plugins : ${response.statusText}`);
	}

	return await response.json();
}

const result = {
	objects: []
};

{
	const batch = await fetchPlugins(0);
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

const remainingPages = Math.ceil(result.total / 250)
for (let i = 1; i < remainingPages; i++) {
	const batch = await fetchPlugins(i * 250);

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
await fs.writeFile('./npm-data/plugins.json', JSON.stringify(result, null, '\t'));
