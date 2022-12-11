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
		var list = document.querySelectorAll('article.plugin')
		for (var i = 0; i < list.length; i++) {
			list[i].removeAttribute('hidden');
		}
	}

	function hideAll() {
		var list = document.querySelectorAll('article.plugin')
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
			sshowAll();
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

		hideAll();
		for (var i = 0; i < matchingItemIDs.length; i++) {
			document.getElementById(matchingItemIDs[i]).removeAttribute('hidden')
		}
	}

	searchInput.addEventListener('keyup', valueChangeHandler)
	searchInput.addEventListener('change', valueChangeHandler)
	searchInput.addEventListener('paste', valueChangeHandler)
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
			document.body.setAttribute('show-detailed-plugin-info', '');
		} else {
			document.body.removeAttribute('show-detailed-plugin-info');
		}
	}

	detailedPluginInfoToggle.addEventListener('change', valueChangeHandler)
})();
