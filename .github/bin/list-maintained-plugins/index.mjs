import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import spdxLicenses from 'spdx-licenses'

const result = {
	objects: []
};

const repositoryIs404 = [
	'@robertcordes/postcss-tailwind-hex'
]

// Forks published on npm without updating sufficient information.
// This is confusing to users because they will be unable to find the source code or contact the maintainer.
const invalidForks = [
	'@alexlafroscia/postcss-color-mod-function',
	'@andreyvolokitin/postcss-inline-svg',
	'@developwithstyle/postcss-custom-media',
	'@doomfist/postcss-px-to-viewport',
	'@espkg/postcss-px-to-viewport',
	'@flemist/postcss-nested',
	'@flemist/postcss-nested',
	'@flemist/postcss-nested-ancestors',
	'@flemist/postcss-pxtorem',
	'@gogogosir/postcss8-px-to-viewport',
	'@hamidreza4dev/postcss-node-sass',
	'@koddsson/postcss-sass',
	'@nikifilini/postcss-d-ts',
	'@outstand/postcss-extend-rule',
	'@peixin/postcss-px-to-viewport',
	'@pumpn/cssnano',
	'@pumpn/postcss-discard-unused',
	'@pumpn/postcss-merge-longhand',
	'@pumpn/postcss-merge-rules',
	'@pumpn/postcss-minify-selectors',
	'@pumpn/postcss-unique-selectors',
	'@pumpn/stylehacks',
	'@rdil/postcss-color-mod-function',
	'@voodeng/postcss-px-to-viewport',
];

// These authors repeatedly listed incorrect data in "package.json"
const ignoreScopes = [
	'flemist',
	'pumpn',
]

const repositoriesByPackageName = new Map()

async function fetchPlugin(name) {
	const response = await fetch(`https://registry.npmjs.org/${name}`)
	if (response.status !== 200) {
		throw new Error(`Fetching detailed plugin data : ${response.statusText}`);
	}

	return await response.json()
}

const postcssData = await fetchPlugin('postcss');
const postcssVersions = Object.keys(postcssData.versions);
postcssVersions.sort((a, b) => {
	return semver.compareLoose(a, b)
})
const lastPostCSSVersion = postcssVersions[postcssVersions.length-1]

const pluginsList = {
	objects: [
		...JSON.parse(await fs.readFile('./npm-data/plugins.json')).objects,
		...JSON.parse(await fs.readFile('./npm-data/maybe-plugins.json')).objects,
	]
};
for (let i = 0; i < pluginsList.objects.length; i++) {
	const plugin = pluginsList.objects[i];
	if (ignoreScopes.includes(plugin.package.scope)) {
		continue
	}

	if (invalidForks.includes(plugin.package.name)) {
		continue
	}

	if (repositoryIs404.includes(plugin.package.name)) {
		continue
	}

	if (!plugin.package.keywords?.map((x) => x.trim().toLowerCase()).includes('postcss-plugin')) {
		continue
	}

	const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json'
	const pluginData = JSON.parse(await fs.readFile(pluginFilePath))
	const versions = Object.keys(pluginData.versions).filter((x) => {
		if (pluginData.versions[x].flags?.unstable === true) {
			return false
		}

		if (semver.prerelease(x)) {
			return false
		}

		if (!semver.gte(x, '1.0.0')) {
			return false
		}

		return true
	})

	if (!versions.length) {
		continue;
	}

	versions.sort((a, b) => {
		return semver.compareLoose(a, b)
	})

	const lastVersion = versions[versions.length - 1];
	const lastVersionData = pluginData.versions[lastVersion];
	if (lastVersionData.dependencies?.postcss) {
		// Direct dependency on PostCSS is no longer advised.
		continue
	}
	
	if (!lastVersionData.peerDependencies?.postcss) {
		// Peer dependency on PostCSS must be declared.
		continue
	}

	if (!semver.validRange(lastVersionData.peerDependencies.postcss)) {
		continue;
	}

	if (!semver.intersects(lastVersionData.peerDependencies.postcss, '>=8.0.0', true)) {
		// Version range MUST allow PostCSS 8 and higher.
		continue;
	}

	if (semver.intersects(lastVersionData.peerDependencies.postcss, '<8.0.0', true)) {
		// Version range MUST NOT allow PostCSS 7 and lower.
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
		licenseStr = 'GPL-2.0'
	}
	if (licenseStr === 'GPL-3.0-only') {
		licenseStr = 'GPL-3.0'
	}

	const license = spdxLicenses.spdx(licenseStr);
	if (!license || !license.OSIApproved && lastVersionData.license !== 'CC0-1.0') {
		// Plugins must have an OSI Approved license or CC0-1.0
		continue
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
		const packageNameWithoutScope = (() => {
			if (!plugin.package.scope || plugin.package.scope === 'unscoped') {
				return plugin.package.name;
			}

			return plugin.package.name.slice(`@${plugin.package.scope}/`.length);
		})();

		const key = `${packageRepository} - ${packageNameWithoutScope}`;
		if (repositoriesByPackageName.has(key)) {
			console.log('possible fork', plugin.package.name);
			console.log(packageRepository);
			console.log('already seen', repositoriesByPackageName.get(key));
			console.log('---------------------------------------------');
		}

		repositoriesByPackageName.set(key, plugin.package.name)
	}

	result.objects.push(plugin);
}

result.objects.sort((a, b) => {
	if (a.package.name !== b.package.name) {
		return a.package.name.localeCompare(b.package.name)
	}

	if (a.package.scope !== b.package.scope) {
		return a.package.scope.localeCompare(b.package.scope)
	}

	return 0
})

result.objects.forEach((x) => {
	delete x.score;
	delete x.searchScore;
})

delete result.time
await fs.writeFile('./npm-data/maintained-plugins.json', JSON.stringify(result, null, '\t'))
