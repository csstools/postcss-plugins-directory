import { cleanObjects } from "../util/clean-objects.mjs";
import { sortObjects } from "../util/sort-objects.mjs";
import { ignoredScopes } from '../../config/ignored-scopes.mjs';
import { ignoredKeywords } from "../../config/ignored-keywords.mjs";
import { invalidForks } from "../../config/invalid-forks.mjs";

async function fetchPlugins(query, offset) {
	const response = await fetch(`${query}&from=${offset}&size=250`);
	if (response.status !== 200) {
		throw new Error(`Fetching plugins : ${response.statusText}`);
	}

	return await response.json();
}

const ignoredScopedSet = new Set();

export async function listPluginsByQuery(query, excluded = new Set()) {
	const seen = new Set();

	const result = {
		objects: []
	};

	function ignored(plugin) {
		if (seen.has(plugin.package.name)) {
			return true;
		}

		if (excluded.has(plugin.package.name)) {
			return true;
		}

		if (ignoredScopes.includes(plugin.package.scope)) {
			return true;
		}

		if (
			plugin.package.keywords?.length > 100 ||
			plugin.package.keywords?.some((keyword) => ignoredKeywords.includes(keyword))
		) {
			if (!ignoredScopedSet.has(plugin.package.scope)) {
				console.log(plugin.package.scope);
				ignoredScopedSet.add(plugin.package.scope);
			}
			return true;
		}

		if (invalidForks.includes(plugin.package.name)) {
			return true;
		}

		return false;
	}

	{
		const batch = await fetchPlugins(query, 0);
		result.total = batch.total;

		for (let i = 0; i < batch.objects.length; i++) {
			const plugin = batch.objects[i];
			if (ignored(plugin)) {
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
			if (ignored(plugin)) {
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
