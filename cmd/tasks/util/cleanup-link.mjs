export function cleanupLink(x) {
	var link = x.slice();

	if (link.startsWith('git+')) {
		link = link.slice(4);
	}

	if (link.startsWith('git://')) {
		link = link.slice(6);
	}

	if (link.startsWith('ssh://git@')) {
		link = 'https://' + link.slice(10);
	}

	if (link.startsWith('git@github.com:')) {
		link = 'https://github.com/' + link.slice(15);
	}

	if (link.startsWith('git@github.com/')) {
		link = 'https://github.com/' + link.slice(15);
	}

	if (link.startsWith('github.com')) {
		link = 'https://' + link;
	}

	if (link.endsWith('.git')) {
		link = link.slice(0, -4);
	}

	if (link.includes('#')) {
		link = link.split('#')[0];
	}

	return link;
}
