/* global $, DDS */

(function() {
	'use strict';

	// Setup app global:
	var TF = window.TF = {};
	TF.renderers = {};



	/*=====================*\
	)  Setup wallets model  (
	\*=====================*/

	// Grab wallets from localStorage (recent last):
	TF.wallets = new DDS($.storage.get('TF_wallets') || [{
		name: 'wallet',
		balance: 0
	}]);

	TF.wallets.on('any', function() {
		$.storage.set('TF_wallets', TF.wallets.objectsObj);
	});



	/*==========================*\
	)  Setup transactions model  (
	\*==========================*/

	// Grab transactions from localStorage (recent last):
	TF.transactions = new DDS($.storage.get('TF_transactions'));

	TF.transactions.on('any', function() {
		$.storage.set('TF_transactions', TF.transactions.objectsObj);
	});



	/*===============================================*\
	)  Add list of wallets to wallet select elements  (
	\*===============================================*/

	function renderWalletOption(data) {
		return new Option(data.name, data._id);
	}

	$.each($.qsa('.wallet-select'), function (selectEl) {
		TF.wallets.render(new DDS.DOMView({
			renderer: renderWalletOption,
			parent: selectEl,
			requiredKeys: ['name']
		}));
	});



	/*========================================*\
	)  Default value for all input[type=date]  (
	\*========================================*/

	$.each($.qsa('input[type=date]'), function(dateInput) {
		if (!dateInput.value) dateInput.value = $.toDashDate(Date.now());
	});

})();