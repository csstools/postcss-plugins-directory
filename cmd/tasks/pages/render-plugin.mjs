import he from 'he';
import { html } from "../util/html.mjs";
import { renderFunding } from "./render-funding.mjs";
import { renderKeywords } from "./render-keywords.mjs";
import { renderScope } from "./render-scope.mjs";
import { renderNodeVersion } from './render-node-version.mjs';

export function renderPlugin(pluginData) {
	return html`
<article class="plugin" id="${he.encode(encodeURIComponent(pluginData.name))}">
	<details>
		<summary>
			<h3>${he.encode(pluginData.unPrefixedPackageName)} ${renderScope(pluginData)}</h3>

			<p>${he.encode(pluginData.description ?? '') || '<i>no description</i>'}</p>
		</summary>

		<dl>
			<dt><a href="https://www.npmjs.com/package/${he.encode(pluginData.name)}">npm</a></dt>
			<dd>
				<code>npm -i ${he.encode(pluginData.name)}</code>
				<button
					class="button-copy-npm-cmd"
					onclick="navigator.clipboard.writeText('npm -i ${he.encode(pluginData.name)}')"
					aria-label="Copy npm install command to clipboard"
					title="Copy to clipboard"
				>✄</button>
			</dd>

			<dt>Version</dt>
			<dd><code>${he.encode(pluginData.version)}</code></dd>

			<dt>License</dt>
			<dd><code>${he.encode(pluginData.license)}</code></dd>

			<dt>PostCSS version range</dt>
			<dd><code>${he.encode(pluginData.peerDependencies.postcss)}</code></dd>

			${renderNodeVersion(pluginData.engines)}

			${renderFunding(pluginData.funding)}
		</dl>

		${renderKeywords(pluginData.keywords)}

		<a class="plugin-anchor-link" href="#${he.encode(encodeURIComponent(pluginData.name))}" title="Link to this item">
			<span class="plugin-anchor-link__icon" aria-hidden="true">☞</span>
		</a>
	</details>
</article>
`;
}
