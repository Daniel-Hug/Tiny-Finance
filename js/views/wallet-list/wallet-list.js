/* global DDS, $, TF */

(function() {
	'use strict';



	/*=========================*\
	)  render main wallet list  (
	\*=========================*/

	var walletTbody = $.qs('.wallet-table tbody');
	var walletListView = TF.wallets.render(new DDS.DOMView({
		renderer: TF.renderers.wallet,
		parent: walletTbody
	}));



	/*================================================*\
	)  Update money total when wallet balances change  (
	\*================================================*/

	var fullTotalEl = $.qs('.wallet-table .total');
	var filteredTotalEl = $.qs('.transactions-table .total');
	TF.moneyTotal = 0;
	TF.filteredMoneyTotal = 0;
	TF.filteredWalletMap = TF.filteredWalletMap || {};

	function addToTotal(addend, walletID) {
		if (addend === 0) return;

		// full total
		TF.moneyTotal = $.stripNum(TF.moneyTotal + addend);
		fullTotalEl.textContent = $.formatMoney(TF.moneyTotal);

		// filtered total
		if (!TF.filteredWalletMap[walletID]) return;
		TF.filteredMoneyTotal = $.stripNum(TF.filteredMoneyTotal + addend);
		filteredTotalEl.textContent = $.formatMoney(TF.filteredMoneyTotal);
	}

	TF.wallets.whenever('add', function(event, newObj) {
		TF.filteredWalletMap[newObj._id] = true;
		addToTotal(newObj.balance, newObj._id);
	});

	TF.wallets.on('edit', function(event, newObj, oldObj) {
		addToTotal(newObj.balance - oldObj.balance, oldObj._id);
	});

	TF.wallets.on('remove', function(event, newObj) {
		addToTotal(-newObj.balance, newObj._id);
		delete TF.filteredWalletMap[newObj._id];
	});



	/*===========================*\
	)  Handle new wallet entries  (
	\*===========================*/

	$.on($.qs('.wallet-form'), 'submit', function(event) {
		// Don't submit the form:
		event.preventDefault();

		// Add the wallet:
		TF.wallets.add({
			name: this.title.value,
			balance: 0
		});
	});

})();