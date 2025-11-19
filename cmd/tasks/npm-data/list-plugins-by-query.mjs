import { cleanObjects } from "../util/clean-objects.mjs";
import { sortObjects } from "../util/sort-objects.mjs";
import { ignoredScopes } from '../../config/ignored-scopes.mjs';
import { ignoredKeywords } from "../../config/ignored-keywords.mjs";
import { invalidForks } from "../../config/invalid-forks.mjs";
import { packageNameAndScope } from "../util/package-name-and-scope.mjs";

async function fetchPlugins(query, offset) {
	await new Promise((resolve) => setTimeout(resolve, 500));
	const response = await fetch(`${query}&from=${offset}&size=250`);
	if (response.status !== 200) {
		throw new Error(`Fetching plugins : ${response.statusText}`);
	}

	return response.json();
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

		const scope = packageNameAndScope(plugin.package.name).scope;
		if (ignoredScopes.includes(scope)) {
			return true;
		}

		if (
			plugin.package.keywords?.length > 100 ||
			plugin.package.keywords?.some((keyword) => ignoredKeywords.includes(keyword))
		) {
			if (!ignoredScopedSet.has(scope)) {
				console.log('scope that should be ignored', scope, plugin.package.name);
				ignoredScopedSet.add(scope);
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
		await new Promise((resolve) => setTimeout(resolve, 1000));

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
