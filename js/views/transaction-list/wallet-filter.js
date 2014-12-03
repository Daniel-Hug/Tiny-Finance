/* global $, TF */

(function() {
	'use strict';

	var filterRefresh = $.debounce(function() {
		TF.views.dataStageTransactions.filter(function(transaction) {
			return TF.views.walletFilters.map[transaction.wallet];
		});
	}, 10);

	function renderWalletFilter(wallet) {
		// Create the checkbox list item:
		var li = document.createElement('li');
		var label = document.createElement('label');
		var checkbox = document.createElement('input');

		checkbox.setAttribute('type', 'checkbox');
		checkbox.value = wallet._id;
		var map = TF.views.walletFilters.map;
		if (map[wallet._id] === undefined) {
			map[wallet._id] = true;
		}
		checkbox.checked = map[wallet._id];
		label.textContent = ' ' + wallet.name;
		$.prependAInB(checkbox, label);
		li.appendChild(label);

		// Filter transactions when a checkbox is clicked:
		$.on(checkbox, 'change', function() {
			TF.views.walletFilters.map[this.value] = this.checked;
			filterRefresh();
		});

		return li;
	}
	TF.renderers.walletFilter = renderWalletFilter;

})();