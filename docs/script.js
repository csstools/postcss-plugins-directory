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

	function showAll() {
		var list = document.querySelectorAll('article.plugin');
		for (var i = 0; i < list.length; i++) {
			list[i].removeAttribute('hidden');
		}
	}

	function hideAll() {
		var list = document.querySelectorAll('article.plugin');
		for (var i = 0; i < list.length; i++) {
			list[i].setAttribute('hidden', '');
		}
	}

	function valueChangeHandler() {
		if (!searchInput.value) {
			showAll();
			return;
		}

		var searchTerms = searchInput.value.toString().split(' ').filter(function (x) {
			return !!x.trim();
		});

		if (!searchTerms.length) {
			showAll();
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

				for (var k = 0; k < pluginData.keywords.length; k++) {
					if (pluginData.keywords[k].includes(currentSearchTerm)) {
						continue SEARCH_TERM_LOOP;
					}
				}

				continue PLUGIN_LOOP;
			}

			matchingItemIDs.push(pluginData.id);
		}

		hideAll();
		for (var i = 0; i < matchingItemIDs.length; i++) {
			document.getElementById(matchingItemIDs[i]).removeAttribute('hidden');
		}
	}

	searchInput.addEventListener('keyup', valueChangeHandler);
	searchInput.addEventListener('change', valueChangeHandler);
	searchInput.addEventListener('paste', valueChangeHandler);
})();

;(function () {
	var detailedPluginInfo = document.getElementById('detailed-plugin-info');
	if (!detailedPluginInfo) {
		return;
	}

	detailedPluginInfo.removeAttribute('hidden');
})();

; (function () {
	var detailedPluginInfoToggle = document.getElementById('toggle-detailed-plugin-info');
	if (!detailedPluginInfoToggle) {
		return;
	}

	function valueChangeHandler() {
		if (detailedPluginInfoToggle.checked) {
			var detailsElements = document.getElementsByTagName('details');
			for (var i = 0; i < detailsElements.length; i++) {
				detailsElements[i].setAttribute('open', '');
			}

		} else {
			var detailsElements = document.getElementsByTagName('details');
			for (var i = 0; i < detailsElements.length; i++) {
				detailsElements[i].removeAttribute('open');
			}
		}
	}

	detailedPluginInfoToggle.addEventListener('change', valueChangeHandler);
})();
