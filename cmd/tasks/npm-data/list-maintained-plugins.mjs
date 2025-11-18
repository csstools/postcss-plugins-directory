import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import spdxLicenseList from 'spdx-license-list'
import { ignoredScopes } from '../../config/ignored-scopes.mjs';
import { ignoredKeywords } from '../../config/ignored-keywords.mjs';
import { invalidForks } from '../../config/invalid-forks.mjs';
import { repositoryIs404 } from '../../config/missing-repositories.mjs';
import { NPM_DATA_LINKS_FILE_PATH, NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH, NPM_DATA_MAYBE_PLUGINS_FILE_PATH, NPM_DATA_PLUGINS_FILE_PATH, POSTCSS_MUST_MATCH_RANGE, POSTCSS_MUST_NOT_MATCH_RANGE, REQUIRED_PACKAGE_KEYWORD } from '../constants.mjs';
import { cleanObjects } from '../util/clean-objects.mjs';
import { cleanupLink } from '../util/cleanup-link.mjs';
import { fetchPlugin } from '../util/fetch-plugin.mjs';
import { filterVersions } from '../util/filter-versions.mjs';
import { sortObjects } from '../util/sort-objects.mjs';
import { readJSONFromFileOrEmptyObject } from '../util/read-json.mjs';
import { packageNameAndScope } from '../util/package-name-and-scope.mjs';

export async function listMaintainedPlugins() {
	const result = {
		objects: []
	};

	const repositoriesByPackageName = new Map();

	const links = new Map(JSON.parse(await fs.readFile(NPM_DATA_LINKS_FILE_PATH)).map((x) => {
		return [x.link, x];
	}));

	const postcssData = await fetchPlugin('postcss');
	const postcssVersions = Object.keys(postcssData.versions);
	postcssVersions.sort((a, b) => {
		return semver.compareLoose(a, b);
	});
	const lastPostCSSVersion = postcssVersions[postcssVersions.length - 1];

	const pluginsList = {
		objects: [
			...JSON.parse(await fs.readFile(NPM_DATA_PLUGINS_FILE_PATH)).objects,
			...JSON.parse(await fs.readFile(NPM_DATA_MAYBE_PLUGINS_FILE_PATH)).objects,
		]
	};
	for (let i = 0; i < pluginsList.objects.length; i++) {
		const plugin = pluginsList.objects[i];
		if (ignoredScopes.includes(packageNameAndScope(plugin.package.name).scope)) {
			continue;
		}

		if (plugin.package.keywords?.some((keyword) => ignoredKeywords.includes(keyword))) {
			continue;
		}

		if (invalidForks.includes(plugin.package.name)) {
			continue;
		}

		if (repositoryIs404.includes(plugin.package.name)) {
			continue;
		}

		if (!plugin.package.keywords?.map((x) => x.trim().toLowerCase()).includes(REQUIRED_PACKAGE_KEYWORD)) {
			continue;
		}

		const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json';
		const pluginData = await readJSONFromFileOrEmptyObject(pluginFilePath);
		
		if ('_downloads' in pluginData) {
			// Plugin must at least be downloaded a 50 times a month.
			// Anything less than that could be a single user or bot traffic.

			if (Array.isArray(pluginData._downloads) && Math.max.apply(null, pluginData._downloads) < 50) {
				continue;
			}

			if (!Array.isArray(pluginData._downloads) && pluginData._downloads < 50) {
				continue;
			}
		}

		const versions = Object.keys(Object(pluginData.versions)).filter(filterVersions(pluginData));
		if (!versions.length) {
			continue;
		}

		versions.sort((a, b) => {
			return semver.compareLoose(a, b);
		});

		const lastVersion = versions[versions.length - 1];
		const lastVersionData = pluginData.versions[lastVersion];
		if (lastVersionData.dependencies?.postcss) {
			// Direct dependency on PostCSS is no longer advised.
			continue;
		}

		if (!lastVersionData.peerDependencies?.postcss) {
			// Peer dependency on PostCSS must be declared.
			continue;
		}

		if (!semver.validRange(lastVersionData.peerDependencies.postcss)) {
			continue;
		}

		if (!semver.intersects(lastVersionData.peerDependencies.postcss, POSTCSS_MUST_MATCH_RANGE, true)) {
			continue;
		}

		if (semver.intersects(lastVersionData.peerDependencies.postcss, POSTCSS_MUST_NOT_MATCH_RANGE, true)) {
			continue;
		}

		if (!semver.satisfies(lastPostCSSVersion, lastVersionData.peerDependencies.postcss)) {
			// The latest PostCSS version MUST be supported.
			continue;
		}

		if (!lastVersionData.license) {
			// Plugin needs a license.
			continue;
		}

		let licenseStr = lastVersionData.license;
		if (licenseStr === 'GPL-2.0-or-later') {
			licenseStr = 'GPL-2.0';
		}
		if (licenseStr === 'GPL-3.0-only') {
			licenseStr = 'GPL-3.0';
		}

		const license = spdxLicenseList[licenseStr];
		if (!license || !license.osiApproved && lastVersionData.license !== 'CC0-1.0') {
			// Plugins must have an OSI Approved license or CC0-1.0
			continue;
		}

		if (plugin.package.name.includes('@csstools') && plugin.package.name.includes('experimental')) {
			// CSSTools has experimental plugins
			continue;
		}

		{
			const packageRepository = plugin.package?.links?.repository ?? lastVersionData.repository?.url ?? lastVersionData.repository ?? '';
			if (!packageRepository) {
				// Plugins must link to a repository
				continue;
			}
			const packageNameWithoutScope = packageNameAndScope(plugin.package.name).name;

			const key = `${packageRepository} - ${packageNameWithoutScope}`;
			if (repositoriesByPackageName.has(key)) {
				console.log('possible fork', plugin.package.name);
				console.log(packageRepository);
				console.log('already seen', repositoriesByPackageName.get(key));
				console.log('---------------------------------------------');
			}

			repositoriesByPackageName.set(key, plugin.package.name);
		}

		if (pluginData.repository) {
			let repositoryLink = (typeof pluginData.repository === 'string') ? pluginData.repository : pluginData.repository?.url
			if (!repositoryLink) {
				continue;
			}

			repositoryLink = cleanupLink(repositoryLink);

			if (links.has(repositoryLink) && links.get(repositoryLink).valid !== true) {
				continue;
			}
		}

		if (pluginData.homepage) {
			let homepageLink = (typeof pluginData.homepage === 'string') ? pluginData.homepage : ''
			if (!homepageLink) {
				continue;
			}

			homepageLink = cleanupLink(homepageLink);

			if (links.has(homepageLink) && links.get(homepageLink).valid !== true) {
				continue;
			}
		}

		result.objects.push(plugin);
	}

	result.objects.sort(sortObjects);
	result.objects.forEach(cleanObjects);

	delete result.time;
	await fs.writeFile(NPM_DATA_MAINTAINED_PLUGINS_FILE_PATH, JSON.stringify(result, null, '\t'));
}
