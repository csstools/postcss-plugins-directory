import he from 'he';
import { html } from '../util/html.mjs';

export function renderScope(pluginData) {
	if (pluginData.scope !== 'unscoped') {
		return html`<span style="font-size: 0.8em;">${he.encode('(@' + pluginData.scope + ')')}</span>`;
	}

	if (pluginData.repository && pluginData.repository.startsWith('https://github.com/cssnano/')) {
		return html`<span style="font-size: 0.8em;">${he.encode('(cssnano)')}</span>`;
	}

	return '';
}
