export async function fetchDownloadCount(name) {
	const response = await fetch(`https://api.npmjs.org/downloads/point/last-month/${name}`);
	if (response.status !== 200) {
		return {
			downloads: 0
		};
	}

	return await response.json();
}
