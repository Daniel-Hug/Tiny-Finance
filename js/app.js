/* global $, DDS */

(function() {
	'use strict';

	// Setup and cache app global:
	var TF = window.TF = {};



	/*=====================*\
	)  Setup wallets model  (
	\*=====================*/

	// Grab wallets from localStorage (recent last):
	var wallets = TF.wallets = new DDS($.storage.get('TF_wallets') || [{
		name: 'wallet',
		balance: 0
	}]);

	wallets.on('any', function() {
		$.storage.set('TF_wallets', wallets.objectsObj);
	});



	/*==========================*\
	)  Setup transactions model  (
	\*==========================*/

	// Grab transactions from localStorage (recent last):
	var transactions = TF.transactions = new DDS($.storage.get('TF_transactions'));

	transactions.on('any', function() {
		$.storage.set('TF_transactions', transactions.objectsObj);
	});



	// Default value for all input[type=date]:
	$.each($.qsa('input[type=date]'), function(dateInput) {
		if (!dateInput.value) dateInput.value = $.toDashDate(Date.now());
	});

})();