import fs from 'fs/promises';
import path from 'path';
import he from 'he';
import { NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH, PAGES_INDEX_HTML_FILE_PATH, PAGES_KEYWORDS_FILE_PATH } from '../constants.mjs';
import { normalizeKeyword } from '../../config/normalize-keywords.mjs';
import { excludedKeywords } from '../../config/excluded-keywords.mjs';
import { traverseDir } from '../util/traverse-dir.mjs';
import { renderPage } from './render-page.mjs';
import { renderPlugin } from './render-plugin.mjs';
import { readJSONFromFileOrEmptyObject } from '../util/read-json.mjs';
import { packageNameAndScope } from '../util/package-name-and-scope.mjs';

const leadingDigits = /^\d+/;

export async function pages() {
	const maintainedPluginsRawData = await fs.readFile(NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH);

	{
		const pluginDataFiles = await traverseDir('./directory');
		const pluginsSet = new Set(JSON.parse(maintainedPluginsRawData).objects.map((plugin) => {
			return path.join('directory', plugin.package.name) + '.json';
		}));

		for (let i = 0; i < pluginDataFiles.length; i++) {
			const pluginDataFile = pluginDataFiles[i];
			if (!pluginsSet.has(pluginDataFile)) {
				await fs.rm(pluginDataFile);
			}
		}
	}

	const pluginDataFiles = await traverseDir('./directory');

	let result = '';
	let searchData = [];
	const allKeywords = new Set();

	const maintainedPluginsData = new Map(JSON.parse(maintainedPluginsRawData).objects.map((plugin) => {
		return [plugin.package.name, plugin];
	}));

	const allPluginData = [];
	for (let i = 0; i < pluginDataFiles.length; i++) {
		const pluginDataFile = pluginDataFiles[i];
		const pluginData = await readJSONFromFileOrEmptyObject(pluginDataFile);
		if (!pluginData.name) {
			continue;
		}

		const nameAndScope = packageNameAndScope(maintainedPluginsData.get(pluginData.name).package.name);

		pluginData.scope = nameAndScope.scope;
		pluginData.unscopedPackageName = nameAndScope.name;
		pluginData.unPrefixedPackageName = unPrefixPackageName(pluginData);
		pluginData.unPrefixedPackageNameWithoutLeadingNumbers = pluginData.unPrefixedPackageName.replace(leadingDigits, '');
		pluginData.repository = maintainedPluginsData.get(pluginData.name).package.links?.repository;
		allPluginData.push(pluginData);
	}

	allPluginData.sort((a, b) => {
		if (a.unPrefixedPackageName !== b.unPrefixedPackageName) {
			return a.unPrefixedPackageNameWithoutLeadingNumbers.localeCompare(b.unPrefixedPackageNameWithoutLeadingNumbers);
		}

		if (!a.scope) {
			return -1;
		} else if (!b.scope) {
			return 1;
		} else {
			return a.name.localeCompare(b.name);
		}
	})

	let counter = 0;
	for (let i = 0; i < allPluginData.length; i++) {
		const pluginData = allPluginData[i];

		pluginData.keywords = (pluginData.keywords?.length ? pluginData.keywords : []).map((x) => {
			return normalizeKeyword(x.toLowerCase().trim());
		}).filter((x) => {
			if (x.toLowerCase().startsWith('postcss')) {
				return false;
			}

			return !excludedKeywords.has(x);
		});

		if (pluginData.repository && pluginData.repository.startsWith('https://github.com/csstools/')) {
			pluginData.keywords.push('csstools');
		}

		if (pluginData.scope === 'csstools') {
			pluginData.keywords.push('csstools');
		}

		if (pluginData.repository && pluginData.repository.startsWith('https://github.com/cssnano/')) {
			pluginData.keywords.push('cssnano');
		}

		if (pluginData.funding?.url) {
			pluginData.keywords.push('sponsor');
		}

		pluginData.keywords = Array.from(new Set(pluginData.keywords));

		searchData.push({
			name: pluginData.name,
			id: he.encode(encodeURIComponent(pluginData.name)),
			keywords: pluginData.keywords,
			description: pluginData.description ?? ''
		});

		for (let j = 0; j < pluginData.keywords.length; j++) {
			allKeywords.add(pluginData.keywords[j]);
		}

		counter++;
		result += renderPlugin(pluginData);
	}

	const allKeywordsSorted = Array.from(allKeywords);
	allKeywordsSorted.sort((a, b) => a.localeCompare(b));

	await fs.writeFile(PAGES_KEYWORDS_FILE_PATH, JSON.stringify(allKeywordsSorted, null, 2));
	await fs.writeFile(PAGES_INDEX_HTML_FILE_PATH, renderPage(result, counter, searchData, allKeywordsSorted));
}

function unPrefixPackageName(pluginData) {
	if (pluginData.unscopedPackageName.startsWith('postcss-')) {
		return pluginData.unscopedPackageName.slice('postcss-'.length);
	}

	if (pluginData.unscopedPackageName.startsWith('css-')) {
		return pluginData.unscopedPackageName.slice('css-'.length);
	}

	return pluginData.unscopedPackageName;
}
