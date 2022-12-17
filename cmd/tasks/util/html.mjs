// Enable "html``" tagged template literals with html syntax highlighting.
export function html(strings, ...values) {
	return String.raw({ raw: strings }, ...values);
}
