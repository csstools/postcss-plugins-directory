import fs from 'fs/promises';
import { NPM_DATA_PLUGINS_FILE_PATH } from '../constants.mjs';
import { listPluginsByQuery } from './list-plugins-by-query.mjs';

export async function listAllPlugins() {
	const result = await listPluginsByQuery('https://registry.npmjs.org/-/v1/search?text=keywords:postcss-plugin');
	await fs.writeFile(NPM_DATA_PLUGINS_FILE_PATH, JSON.stringify(result, null, '\t'));
}
