import he from 'he';
import { html } from '../util/html.mjs';

export function renderScope(pluginData) {
	if (pluginData.scope !== 'unscoped') {
		return html`<span style="opacity: 0.7;">${he.encode('@' + pluginData.scope + '/')}</span>`;
	}

	return '';
}
