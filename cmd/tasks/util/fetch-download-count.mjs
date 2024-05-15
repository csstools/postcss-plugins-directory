export async function fetchDownloadCount(name) {
	await new Promise((resolve) => setTimeout(resolve, 100));
	const response = await fetch(`https://api.npmjs.org/downloads/point/last-month/${name}`);
	if (response.status !== 200) {
		return {
			downloads: 0
		};
	}

	return await response.json();
}
