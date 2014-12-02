/* global $, TF */

(function() {
	'use strict';

	TF.filteredWalletMap = TF.filteredWalletMap || {};

	// Keep TF.filteredWalletMap updated when checkboxes are checked/unchecked
	TF.walletFilterChange = function() {
		/*jshint validthis: true */
		TF.filteredWalletMap[this.value] = this.checked;
		TF.filterTransactions();
	};


	TF.filterTransactions = $.debounce(function() {
		TF.dataStageTransactions.filter(function(transaction) {
			return TF.filteredWalletMap[transaction.wallet];
		});
	}, 10);

	function renderWalletFilter(wallet) {
		// Create the checkbox list item:
		var li = document.createElement('li');
		var label = document.createElement('label');
		var checkbox = document.createElement('input');

		checkbox.setAttribute('type', 'checkbox');
		checkbox.value = wallet._id;
		if (TF.filteredWalletMap[wallet._id] === undefined) {
			TF.filteredWalletMap[wallet._id] = true;
		}
		checkbox.checked = TF.filteredWalletMap[wallet._id];
		label.textContent = ' ' + wallet.name;
		$.prependAInB(checkbox, label);
		li.appendChild(label);

		// Filter transactions when a checkbox is clicked:
		$.on(checkbox, 'change', TF.walletFilterChange);

		return li;
	}
	TF.renderers.walletFilter = renderWalletFilter;

})();