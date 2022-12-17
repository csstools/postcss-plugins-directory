import fs from 'fs/promises';
import { NPM_DATA_MAYBE_PLUGINS_FILE_PATH, NPM_DATA_PLUGINS_FILE_PATH } from '../constants.mjs';
import { listPluginsByQuery } from './list-plugins-by-query.mjs';

export async function listMaybePlugins() {
	const excluded = new Set();
	const pluginsList = JSON.parse(await fs.readFile(NPM_DATA_PLUGINS_FILE_PATH));
	for (let i = 0; i < pluginsList.objects.length; i++) {
		const plugin = pluginsList.objects[i];
		excluded.add(plugin.package.name);
	}

	const result = await listPluginsByQuery('https://registry.npmjs.org/-/v1/search?text=postcss', excluded);
	await fs.writeFile(NPM_DATA_MAYBE_PLUGINS_FILE_PATH, JSON.stringify(result, null, '\t'));
}
