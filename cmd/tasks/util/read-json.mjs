import fs from 'fs/promises';

export async function readJSONFromFileOrEmptyObject(path) {
	try {
		return JSON.parse(await fs.readFile(path, 'utf8'));
	} catch {
		return {};
	}
}
