import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import { NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH } from '../constants.mjs';
import { filterVersions } from '../util/filter-versions.mjs';
import { readJSONFromFileOrEmptyObject } from '../util/read-json.mjs';

export async function lastPluginVersionInfo() {
	const pluginsList = JSON.parse(await fs.readFile(NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH));
	for (let i = 0; i < pluginsList.objects.length; i++) {
		const plugin = pluginsList.objects[i];
		const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json';
		const pluginData = await readJSONFromFileOrEmptyObject(pluginFilePath);
		const versions = Object.keys(Object(pluginData.versions)).filter(filterVersions(pluginData))

		if (!versions.length) {
			continue;
		}

		versions.sort((a, b) => {
			return semver.compareLoose(a, b);
		});

		const lastVersionData = pluginData.versions[versions[versions.length - 1]];
		const time = pluginData.time[versions[versions.length - 1]];
		lastVersionData._time = time;

		const lastVersionFilePath = path.join('npm-data', 'last-version', plugin.package.name) + '.json';
		await fs.mkdir(path.dirname(lastVersionFilePath), { recursive: true });
		await fs.writeFile(lastVersionFilePath, JSON.stringify(lastVersionData, null, '\t'));
	}
}
