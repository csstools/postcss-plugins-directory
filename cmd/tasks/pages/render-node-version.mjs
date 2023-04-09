import he from 'he';
import { html } from "../util/html.mjs";

export function renderNodeVersion(engines) {
	if (engines?.node) {
		return html`
	<dt>Node version range</dt>
	<dd><code>${he.encode(engines.node)}</code></dd>
`;
	}

	return '';
}
