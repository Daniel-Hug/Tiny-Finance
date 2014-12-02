/* global DDS, $, TF */

(function() {
	'use strict';



	/*=========================*\
	)  render main wallet list  (
	\*=========================*/

	var walletTbody = $.qs('.wallet-table tbody');
	TF.walletListView = TF.wallets.render(new DDS.DOMView({
		renderer: TF.renderers.wallet,
		parent: walletTbody
	}));



	/*================================================*\
	)  Update money total when wallet balances change  (
	\*================================================*/

	TF.moneyTotal = 0;
	var fullTotalEl = $.qs('.wallet-table .total');
	TF.walletListView.on('any', function() {
		var total = 0;
		this.objects.forEach(function(wallet) {
			total += wallet.balance;
		});
		TF.moneyTotal = total;
		fullTotalEl.textContent = $.formatMoney(TF.moneyTotal);
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