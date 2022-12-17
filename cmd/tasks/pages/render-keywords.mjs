import he from 'he';

export function renderKeywords(keywords) {
	if (keywords?.length) {
		const uniqueKeywords = Array.from(new Set(keywords)).filter((x) => {
			if (x === 'csstools') {
				return false;
			}

			if (x === 'sponsor') {
				return false
			}

			return true;
		});
		uniqueKeywords.sort((a, b) => a.localeCompare(b));

		return '<ul>' + uniqueKeywords.map((keyword) => `<li>${he.encode(keyword)}</li>`).join('') + '</ul>';
	}

	return '';
}
