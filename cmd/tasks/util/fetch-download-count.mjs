export async function fetchDownloadCount(name) {
	await new Promise((resolve) => setTimeout(resolve, 500));
	const response = await fetch(`https://api.npmjs.org/downloads/point/last-month/${name}`);
	if (response.status !== 200) {
		throw new Error(`Fetching downloads count : ${response.statusText}`);
	}

	return await response.json();
}
