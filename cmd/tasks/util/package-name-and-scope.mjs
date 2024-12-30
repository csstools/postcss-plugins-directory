export function packageNameAndScope(packageName) {
	if (!packageName.startsWith('@')) {
		return {
			scope: "",
			name: packageName,
		}
	}

	const scope = packageName.split('/')[0].slice(1);

	return {
		scope: scope,
		name: packageName.slice(`@${scope}/`.length),
	}
}
