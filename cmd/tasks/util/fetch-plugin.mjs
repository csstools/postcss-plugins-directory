export async function fetchPlugin(name) {
	await new Promise((resolve) => setTimeout(resolve, 500));
	const response = await fetch(`https://registry.npmjs.org/${name}`);
	if (response.status !== 200) {
		throw new Error(`Fetching detailed plugin data : ${response.statusText}`);
	}

	return await response.json();
}
