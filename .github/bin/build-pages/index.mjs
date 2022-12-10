import fs from 'fs/promises';
import path from 'path';
import he from 'he';

function renderPage(body) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>PostCSS Plugin Directory</title>

	<link rel="stylesheet" href="./style.css">
</head>
<body>
	<h1>PostCSS Plugin Directory</h1>
	<p>A directory of PostCSS plugins.<br>This list aims to only show plugins that you can use today.</p>

	<h2>Criteria</h2>
	<ul>
		<li>published on npm</li>
		<li>postcss-plugin keyword in your <code>package.json</code></li>
		<li>a repository link in your <code>package.json</code></li>
		<li>valid peer dependency value for postcss</li>
		<li><a href="https://opensource.org/licenses/alphabetical">OSI approved license</a></li>
		<li>package version greater than 1.0.0</li>
	</ul>

	<h2>Disclaimer</h2>
	<p>
		It is not possible to audit each plugin for security or interoperability issues.<br>
		It remains your responsibility to choose the best dependencies for your project.
	</p>

	<hr>

	<h2>Directory</h2>

	${body}
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

const pluginDataFiles = await traverseDir('./directory');

let result = '';
const excludedKeywords = ['postcss', 'postcss-plugin', 'css', 'css4', 'css3']

for (let i = 0; i < pluginDataFiles.length; i++) {
	const pluginDataFile = pluginDataFiles[i];
	const pluginData = JSON.parse(await fs.readFile(pluginDataFile))

	result += `
		<article class="plugin">
			<h3>${he.encode(pluginData.name)}</h3>
			<p>${he.encode(pluginData.description) || '<i>no description</i>'}</p>

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

await fs.writeFile('./docs/index.html', renderPage(result))
