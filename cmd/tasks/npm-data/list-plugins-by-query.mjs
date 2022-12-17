import { cleanObjects } from "../util/clean-objects.mjs";
import { sortObjects } from "../util/sort-objects.mjs";

async function fetchPlugins(query, offset) {
	const response = await fetch(`${query}&from=${offset}&size=250`);
	if (response.status !== 200) {
		throw new Error(`Fetching plugins : ${response.statusText}`);
	}

	return await response.json();
}

export async function listPluginsByQuery(query, excluded = new Set()) {
	const seen = new Set();

	const result = {
		objects: []
	};

	{
		const batch = await fetchPlugins(query, 0);
		result.total = batch.total;

		for (let i = 0; i < batch.objects.length; i++) {
			const plugin = batch.objects[i];
			if (seen.has(plugin.package.name)) {
				continue;
			}

			if (excluded.has(plugin.package.name)) {
				continue;
			}

			seen.add(plugin.package.name);
			result.objects.push(plugin);
		}
	}

	const remainingPages = Math.ceil(result.total / 250)
	for (let i = 1; i < remainingPages; i++) {
		const batch = await fetchPlugins(query, i * 250);

		for (let j = 0; j < batch.objects.length; j++) {
			const plugin = batch.objects[j];
			if (seen.has(plugin.package.name)) {
				continue;
			}

			if (excluded.has(plugin.package.name)) {
				continue;
			}

			seen.add(plugin.package.name);
			result.objects.push(plugin);
		}
	}

	result.objects.sort(sortObjects);
	result.objects.forEach(cleanObjects);

	delete result.time;
	return result;
}
