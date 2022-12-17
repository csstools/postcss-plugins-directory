import { PLUGIN_MINIMUM_VERSION } from "../constants.mjs";

export const filterVersions = (x) => {
	if (pluginData.versions[x].flags?.unstable === true) {
		return false;
	}

	if (semver.prerelease(x)) {
		return false;
	}

	if (!semver.gte(x, PLUGIN_MINIMUM_VERSION)) {
		return false;
	}

	return true;
}
