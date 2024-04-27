import fs from 'fs/promises';
import path from 'path';
import { NPM_DATA_LINKS_FILE_PATH, NPM_DATA_PLUGINS_FILE_PATH } from '../constants.mjs';
import { cleanupLink } from '../util/cleanup-link.mjs';
import { shuffle } from '../util/shuffle.mjs';
import { readJSONFromFileOrEmptyObject } from '../util/read-json.mjs';

let counter = 0;

async function checkLinkStatus(link) {
	if (link.includes('://git@')) {
		return 500;
	}

	let u;
	try {
		u = new URL(link);
	} catch (_) {
		try {
			u = new URL(link, 'https://github.com');
		} catch (_) {
			return 500;
		}
	}

	const headers = {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
	};

	if (counter >= 250) {
		return 429;
	}

	counter++;

	return fetch(u, {
		method: 'HEAD',
		headers: headers,
	}).then((res) => {
		return res.status;
	}).catch((err) => {
		return 500;
	});
}

export async function validateLinks() {
	const now = Date.now();
	const threshold = now - (86400000 * 14);

	let expiredLinksCounter = 0;
	const links = new Map(JSON.parse(await fs.readFile(NPM_DATA_LINKS_FILE_PATH)).filter((x) => {
		if (x.timestamp < threshold && expiredLinksCounter++ < 200) {
			return false;
		}

		return true;
	}).map((x) => {
		x.link = cleanupLink(x.link);

		return [x.link, x]
	}));

	const pluginsList = JSON.parse(await fs.readFile(NPM_DATA_PLUGINS_FILE_PATH));
	pluginsList.objects = shuffle(pluginsList.objects);

	for (let i = 0; i < pluginsList.objects.length; i++) {
		const plugin = pluginsList.objects[i];
		const pluginFilePath = path.join('npm-data', 'plugins', plugin.package.name) + '.json';
		const pluginData = await readJSONFromFileOrEmptyObject(pluginFilePath);

		if (pluginData.repository) {
			let repositoryLink = (typeof pluginData.repository === 'string') ? pluginData.repository : pluginData.repository?.url;
			if (repositoryLink) {
				repositoryLink = cleanupLink(repositoryLink);

				if (!links.has(repositoryLink)) {
					const linkStatus = await checkLinkStatus(repositoryLink);
					if (linkStatus === 429) {
						break;
					}

					links.set(repositoryLink, {
						timestamp: now,
						link: repositoryLink,
						valid: linkStatus === 200
					});
				}
			}
		}

		if (pluginData.homepage) {
			let homepageLink = (typeof pluginData.homepage === 'string') ? pluginData.homepage : '';
			if (homepageLink) {
				homepageLink = cleanupLink(homepageLink);

				if (!links.has(homepageLink)) {
					const linkStatus = await checkLinkStatus(homepageLink);
					if (linkStatus === 429) {
						break;
					}

					links.set(homepageLink, {
						timestamp: now,
						link: homepageLink,
						valid: linkStatus === 200
					});
				}
			}
		}
	}

	const results = Array.from(links.values());
	results.sort((a, b) => a.link.localeCompare(b.link));

	await fs.writeFile(NPM_DATA_LINKS_FILE_PATH, JSON.stringify(results, null, '\t'));
}
