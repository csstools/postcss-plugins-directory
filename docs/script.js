;(function () {
	var searchForm = document.getElementById('search');
	if (!searchForm) {
		return;
	}

	searchForm.removeAttribute('hidden');
})();

;(function () {
	var searchInput = document.getElementById('search-input');
	if (!searchInput) {
		return;
	}

	var searchStyles = document.body.appendChild(document.createElement('style'));

	function valueChangeHandler() {
		if (!searchInput.value) {
			searchStyles.innerText = '';
			return;
		}

		var searchTerms = searchInput.value.toString().split(' ').filter(function (x) {
			return !!x.trim();
		});

		if (!searchTerms.length) {
			searchStyles.innerText = '';
			return;
		}

		var matchingItemIDs = [];
		PLUGIN_LOOP: for (var i = 0; i < window._searchData.length; i++) {
			var pluginData = window._searchData[i];
			
			SEARCH_TERM_LOOP: for (var j = 0; j < searchTerms.length; j++) {
				var currentSearchTerm = searchTerms[j];

				if (pluginData.name.includes(currentSearchTerm)) {
					continue SEARCH_TERM_LOOP;
				}

				if (pluginData.description.includes(currentSearchTerm)) {
					continue SEARCH_TERM_LOOP;
				}

				if (pluginData.keywords.includes(currentSearchTerm)) {
					continue SEARCH_TERM_LOOP;
				}

				continue PLUGIN_LOOP;
			}

			matchingItemIDs.push(pluginData.id)
		}

		var styles = 'article.plugin { display: none; }';
		for (var i = 0; i < matchingItemIDs.length; i++) {
			styles += 'article.plugin[id="' + matchingItemIDs[i] +'"] { display: block; }';
		}

		searchStyles.innerText = styles;
	}

	searchInput.addEventListener('keyup', valueChangeHandler)
	searchInput.addEventListener('change', valueChangeHandler)
	searchInput.addEventListener('paste', valueChangeHandler)
})();
