/* global $, TF */

(function() {
	'use strict';

	var walletTbody = $.qs('.wallet-table tbody');

	function renderWallet(wallet) {
		var walletRow = $.tmp.wallet({
			name: wallet.name,
			balance: $.formatMoney(wallet.balance || 0)
		});
		var editButton = $.qs('button', walletRow);
		var editForm = $.qs('form', walletRow);
		var editField = $.qs('input[type=text]', walletRow);

		$.on(editButton, 'click', function() {
			var activeEditField;
			if (( activeEditField = $.qs('input[type=text]:not([disabled])', walletTbody) ) && activeEditField !== editField)
				activeEditField.disabled = true;
			editField.disabled = !editField.disabled;
			if (!editField.disabled) editField.focus();
		});

		// Edit wallet name:
		$.on(editForm, 'submit', function(event) {
			event.preventDefault();
			TF.walletListView.edit(wallet, {name: this.name.value});
		});

		// Remove wallet:
	//	on(qs('.delete', walletRow), 'click', function(event) {
	//		wallets.remove(wallet);
	//	});

		return walletRow;
	}
	TF.renderers.wallet = renderWallet;

})();