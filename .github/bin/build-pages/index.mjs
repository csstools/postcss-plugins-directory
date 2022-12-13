import fs from 'fs/promises';
import path from 'path';
import he from 'he';

const excludedKeywords = [
	'css',
	'css3',
	'css4',
	'csswg',
	'lib',
	'node',
	'postcss',
	'postcss-plugin',
	'style',
]

function renderPage(body, searchData, allKeywords) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>PostCSS Plugin Directory</title>

	<script type="text/javascript" src="./script.js" defer=""></script>
	<link rel="stylesheet" href="./style.css">
	<script>
		window._searchData = ${JSON.stringify(searchData)}
	</script>
</head>
<body>
	<h1>PostCSS Plugin Directory</h1>
	<p>A directory of PostCSS plugins.<br>This list aims to only show plugins that you can use today.</p>

	<h2>Criteria</h2>
	<ul>
		<li>published on npm</li>
		<li>postcss-plugin keyword in your <code>package.json</code></li>
		<li>valid repository link in your <code>package.json</code></li>
		<li>valid homepage link in your <code>package.json</code></li>
		<li>valid peer dependency value for postcss</li>
		<li><a href="https://opensource.org/licenses/alphabetical">OSI approved license</a></li>
		<li>package version greater than 1.0.0</li>
	</ul>

	<h2>Disclaimer</h2>
	<p>
		PostCSS plugins are created and maintained by many different authors.
		This is not a list of plugins created by "PostCSS".
	</p>

	<p>
		It is not possible to audit each plugin for security or interoperability issues.
		It remains your responsibility to choose the best dependencies for your project.
	</p>

	<hr>

	<h2>Directory</h2>

	<div hidden id="detailed-plugin-info">
		<label for="toggle-detailed-plugin-info">Show detailed plugin info</label><br>
		<input type="checkbox" id="toggle-detailed-plugin-info" name="detailed-plugin-info">
	</div>

	<div hidden id="search" role="search" aria-label="Plugins">
		<label for="search-input">Search all plugins</label><br>
		<input type="search" list="search-suggestions" id="search-input" name="search" spellcheck="false">

		<datalist id="search-suggestions">
			${allKeywords.map((x) => `<option value="${x}">`).join('')}
		</datalist>
	</div>

	<div id="plugin-list">
		${body}
	</div>
</body>
</html>
`
}

function renderFunding(funding) {
	if (funding?.url && funding?.type) {
		return `
				<dt>Funding</dt>
				<dd><a href="${he.encode(funding.url)}">${he.encode(funding.type)}</a></dd>
			`;
	}

	return '';
}

function renderKeywords(keywords) {
	if (keywords?.length) {
		const uniqueKeywords = Array.from(new Set(keywords)).filter((x) => !excludedKeywords.includes(x));
		uniqueKeywords.sort((a, b) => a.localeCompare(b));

		return '<ul>' + uniqueKeywords.map((keyword) => `<li>${he.encode(keyword)}</li>`).join('') + '</ul>';
	}

	return '';
}

function renderScope(pluginData) {
	if (pluginData.scope !== 'unscoped') {
		return `<span style="opacity: 0.6;">${he.encode('@' + pluginData.scope + '/')}</span>`
	}

	return ''
}

async function traverseDir(dir) {
	const out = [];

	const files = await fs.readdir(dir);
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		let fullPath = path.join(dir, file);
		if ((await fs.lstat(fullPath)).isDirectory()) {
			out.push(...(await traverseDir(fullPath)));
		} else {
			out.push(fullPath)
		}
	}

	return out;
}

{
	const pluginDataFiles = await traverseDir('./directory');
	const pluginsSet = new Set(JSON.parse(await fs.readFile('./npm-data/maintained-plugins.json')).objects.map((plugin) => {
		return path.join('directory', plugin.package.name) + '.json'
	}));

	for (let i = 0; i < pluginDataFiles.length; i++) {
		const pluginDataFile = pluginDataFiles[i];
		if (!pluginsSet.has(pluginDataFile)) {
			await fs.rm(pluginDataFile)
		}
	}
}

const pluginDataFiles = await traverseDir('./directory');

let result = '';
let searchData = [];
const allKeywords = new Set();

const maintainedPluginsData = new Map(JSON.parse(await fs.readFile('./npm-data/maintained-plugins.json')).objects.map((plugin) => {
	return [plugin.package.name, plugin]
}));

const allPluginData = [];
for (let i = 0; i < pluginDataFiles.length; i++) {
	const pluginDataFile = pluginDataFiles[i];
	const pluginData = JSON.parse(await fs.readFile(pluginDataFile));
	pluginData.scope = maintainedPluginsData.get(pluginData.name).package.scope
	pluginData.unscopedPackageName = unscopedPackageName(pluginData)
	allPluginData.push(pluginData)
}

function unscopedPackageName(pluginData) {
	if (!pluginData.scope || pluginData.scope === 'unscoped') {
		return pluginData.name;
	}

	return pluginData.name.slice(`@${pluginData.scope}/`.length);
}

allPluginData.sort((a, b) => {
	if (a.unscopedPackageName !== b.unscopedPackageName) {
		return a.unscopedPackageName.localeCompare(b.unscopedPackageName)
	}

	if (a.scope === 'unscoped') {
		return -1
	} else if (b.scope === 'unscoped') {
		return 1
	} else {
		return a.name.localeCompare(b.name)
	}
})

for (let i = 0; i < allPluginData.length; i++) {
	const pluginData = allPluginData[i];

	searchData.push({
		name: pluginData.name,
		id: he.encode(encodeURIComponent(pluginData.name)),
		keywords: (pluginData.keywords?.length ? pluginData.keywords : []).map((x) => {
			return x.toLowerCase().trim();
		}),
		description: pluginData.description ?? ''
	});

	if (pluginData.keywords) {
		for (let j = 0; j < pluginData.keywords.length; j++) {
			allKeywords.add(he.encode(pluginData.keywords[j].toLowerCase().trim()));
		}
	}

	result += `
		<article class="plugin" id="${he.encode(encodeURIComponent(pluginData.name))}">
			<h3>
				<a class="plugin-anchor-link" href="#${he.encode(encodeURIComponent(pluginData.name))}">
					<span class="plugin-anchor-link__icon" aria-hidden="true">☞</span>
					${renderScope(pluginData)}${he.encode(pluginData.unscopedPackageName)}
				</a>
			</h3>

			<a class="plugin-npm-link-for-summary" href="https://www.npmjs.com/package/${he.encode(pluginData.name)}">npm</a>
			
			<p>
				${he.encode(pluginData.description ?? '') || '<i>no description</i>'}
				
			</p>

			<dl>
				<dt><a href="https://www.npmjs.com/package/${he.encode(pluginData.name)}">npm</a></dt>
				<dd><code>npm -i ${he.encode(pluginData.name)}</code></dd>

				<dt>Version</dt>
				<dd><code>${he.encode(pluginData.version)}</code></dd>

				<dt>License</dt>
				<dd><code>${he.encode(pluginData.license)}</code></dd>

				<dt>PostCSS version range</dt>
				<dd><code>${he.encode(pluginData.peerDependencies.postcss)}</code></dd>
				
				${renderFunding(pluginData.funding)}
			</dl>

			${renderKeywords(pluginData.keywords)}
		</article>
	`
}

const allKeywordsSorted = Array.from(allKeywords).filter((x) => !excludedKeywords.includes(x));
allKeywordsSorted.sort((a, b) => a.localeCompare(b))

await fs.writeFile('./docs/index.html', renderPage(result, searchData, allKeywordsSorted))
