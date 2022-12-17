export const sortObjects = (a, b) => {
	if (a.package.name !== b.package.name) {
		return a.package.name.localeCompare(b.package.name);
	}

	if (a.package.scope !== b.package.scope) {
		return a.package.scope.localeCompare(b.package.scope);
	}

	return 0;
};
