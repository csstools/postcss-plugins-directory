export async function fetchDownloadCount(name) {
	await new Promise((resolve) => setTimeout(resolve, 500));
	const response = await fetch(`https://api.npmjs.org/downloads/point/last-month/${name}`);
	if (response.status === 429) {
		await new Promise((resolve) => setTimeout(resolve, 10000));
		return fetchDownloadCount(name);
	}

	if (response.status === 404) {
		return {
			downloads: 0
		}
	}
	
	if (!response.ok) {
		throw new Error(`Fetching downloads count : ${response.statusText}`);
	}

	return response.json();
}
