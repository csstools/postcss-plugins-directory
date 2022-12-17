import he from 'he';

export function renderKeywords(keywords) {
	if (keywords?.length) {
		const uniqueKeywords = Array.from(new Set(keywords));
		uniqueKeywords.sort((a, b) => a.localeCompare(b));

		return '<ul>' + uniqueKeywords.map((keyword) => `<li>${he.encode(keyword)}</li>`).join('') + '</ul>';
	}

	return '';
}
