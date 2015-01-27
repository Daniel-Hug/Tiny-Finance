/* global DDS, $, TF */

(function() {
	'use strict';



	/*=========================*\
	)  render main wallet list  (
	\*=========================*/

	TF.views.walletList = TF.wallets.render(new DDS.DOMView({
		renderer: TF.renderers.wallet,
		parent: $.qs('.wallet-table tbody')
	}));



	/*================================================*\
	)  Update money total when wallet balances change  (
	\*================================================*/

	TF.moneyTotal = 0;
	var fullTotalEl = $.qs('.wallet-table .total');
	function updateWalletTotal() {
		var total = 0;
		TF.wallets.objects.forEach(function(wallet) {
			total += wallet.balance;
		});
		TF.moneyTotal = total;
		fullTotalEl.textContent = $.formatMoney(TF.moneyTotal);
	}
	updateWalletTotal();
	TF.views.walletList.on('any', updateWalletTotal);



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

		this.title.value = '';
	});

})();