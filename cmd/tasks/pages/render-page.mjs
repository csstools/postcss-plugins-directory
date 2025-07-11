import he from 'he';
import { html } from "../util/html.mjs";

export function renderPage(body, numberOfPlugins, searchData, allKeywords) {
	return html`<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>PostCSS Plugin Directory - CSS Tools</title>

	<script type="text/javascript" src="./script.js" defer=""></script>
	<link rel="stylesheet" href="./style.css">
	<link href="./favicon.ico" rel="shortcut icon">
	<script>
		window._searchData = ${JSON.stringify(searchData)}
	</script>
</head>

<body>
	<img class="csstools-logo" src="./css-tools.svg" alt="CSS Tools" width="220" height="100">
	<div class="header">
		<img src="./postcss.svg" width="100" height="100" alt="PostCSS logo">
		<h1>PostCSS Plugin Directory</h1>
		<p>A directory with ${numberOfPlugins} PostCSS plugins.<br>This list aims to only show plugins that you can use today.</p>
	</div>

	<h2>Criteria</h2>
	<ul>
		<li>published on npm</li>
		<li>50 monthly downloads from npm</li>
		<li><code>postcss-plugin</code> keyword in your <code>package.json</code></li>
		<li>valid repository link in your <code>package.json</code></li>
		<li>valid homepage link in your <code>package.json</code></li>
		<li>valid peer dependency value for postcss</li>
		<li><a href="https://opensource.org/licenses/alphabetical">OSI approved license</a></li>
		<li>package version greater than 1.0.0</li>
		<li><a href="https://github.com/DataDog/malicious-software-packages-dataset">not listed as a malicious package</a></li>
	</ul>

	<hr>

	<h2>Directory</h2>

	<div hidden id="detailed-plugin-info">
		<input type="checkbox" id="toggle-detailed-plugin-info" name="detailed-plugin-info">
		<label for="toggle-detailed-plugin-info">
			Show detailed plugin info
		</label>
	</div>

	<div hidden id="search" role="search" aria-label="Plugins">
		<label for="search-input">Search all plugins</label><br>
		<input type="search" list="search-suggestions" id="search-input" name="search" spellcheck="false">

		<datalist id="search-suggestions">
			${allKeywords.map((x) => html`<option value="${he.encode(x)}">`).join('')}
		</datalist>
	</div>

	<div id="plugin-list">
		${body}
	</div>

	<hr style="margin: 3rem 0;">

	<h2>Disclaimer</h2>
	<p>
		PostCSS plugins are created and maintained by many different authors.
		This is not a list of plugins created by "PostCSS".
	</p>

	<p>
		It is not possible to audit each plugin for security or interoperability issues.
		It remains your responsibility to choose the best dependencies for your project.
	</p>

	<p>
		<a href="https://github.com/csstools/postcss-plugins-directory">For support and issues you can open an issue on GitHub.</a>
	</p>
</body>
</html>
`;
}
