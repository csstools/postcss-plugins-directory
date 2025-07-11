import fs from 'fs/promises';
import { NPM_DATA_MALICIOUS_PACKAGES_PATH } from '../constants.mjs';

export async function listMaliciousPackages() {
	const result = await fetch('https://raw.githubusercontent.com/DataDog/malicious-software-packages-dataset/refs/heads/main/samples/npm/manifest.json');
	if (!result.ok) {
		throw new Error(`Fetching malicious packages : ${response.statusText}`);
	}

	const resultText = await result.text();
	await fs.writeFile(NPM_DATA_MALICIOUS_PACKAGES_PATH, resultText.trim() + '\n');
}
