import { html } from "../util/html.mjs";
import he from 'he';

export function renderFunding(funding) {
	if (funding?.url && funding?.type) {
		return html`
	<dt>Funding</dt>
	<dd><a href="${he.encode(funding.url)}">${he.encode(funding.type)}</a></dd>
`;
	}

	return '';
}
