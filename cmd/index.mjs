import { parseArgs } from "node:util";
import { updateTheDirectory } from "./tasks/directory/directory.mjs";
import { fetchDetailedPluginData } from "./tasks/npm-data/fetch-detailed-plugin-data.mjs";
import { lastPluginVersionInfo } from "./tasks/npm-data/last-plugin-version-info.mjs";
import { listAllPlugins } from "./tasks/npm-data/list-all-plugins.mjs";
import { listMaintainedPlugins } from "./tasks/npm-data/list-maintained-plugins.mjs";
import { listMaybePlugins } from "./tasks/npm-data/list-maybe-plugins.mjs";
import { pages } from "./tasks/pages/pages.mjs";
import { validateLinks } from "./tasks/validate-links/index.mjs";
import { listMaliciousPackages } from "./tasks/npm-data/fetch-malicious-packages-list.mjs";

await main()
async function main() {
	const args = process.argv.slice(2);
	const mainCmdParsed = parseArgs({
		args: args,
		strict: false,
		tokens: true,
	});

	let firstPositional = mainCmdParsed.tokens.find((e) => {
		return e.kind === 'positional'
	});

	if (!firstPositional) {
		printSubCommandsAndExit();
	}

	switch (firstPositional.value) {
		case 'pages':
			pages()
			break;
		case 'npm-data':
			await listMaliciousPackages();
			await listAllPlugins();
			await listMaybePlugins();
			await fetchDetailedPluginData();
			await validateLinks();
			await listMaintainedPlugins();
			await lastPluginVersionInfo();
			break;
		case 'npm-list-malicious-packages':
			await listMaliciousPackages();
			break;
		case 'npm-list-all-plugins':
			await listAllPlugins();
			break;
		case 'npm-list-maybe-plugins':
			await listMaybePlugins();
			break;
		case 'npm-fetch-detailed-plugin-data':
			await fetchDetailedPluginData();
			break;
		case 'npm-validate-links':
			await validateLinks();
			break;
		case 'npm-list-maintained-plugins':
			await listMaintainedPlugins();
			break;
		case 'npm-last-plugin-version-info':
			await lastPluginVersionInfo();
			break;
		case 'update-directory':
			await updateTheDirectory();
			break;
		case 'update-name-from-plugin-data':
			const data = JSON.parse(Buffer.from(process.env.UPDATED_PLUGIN_DATA, 'base64').toString());
			process.stdout.write(data.updateName);
			break;

		default:
			printSubCommandsAndExit();
	}

	// In case we need sub command flags :
	// let parsed = parseArgs({ args: args.slice(firstPositional.index+1), strict: true });
}

function printSubCommandsAndExit() {
	console.log('Use one of the sub commands:');
	console.log([
		'directory',
		'npm-data',
		'npm-fetch-detailed-plugin-data',
		'npm-last-plugin-version-info',
		'npm-list-all-plugins',
		'npm-list-maintained-plugins',
		'npm-list-malicious-packages',
		'npm-list-maybe-plugins',
		'npm-validate-links',
		'pages',
	].join('\n'));
	process.exit(1);
}
