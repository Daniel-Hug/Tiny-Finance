/* global wallets, Parasite, tmp, each, qs, qsa, on, formatMoney */

(function() {
	'use strict';

	// Add wallets to select element in transaction form:
	function renderWalletOption(data) {
		return new Option(data.name, data._id);
	}
	each(qsa('.wallet-select'), function (selectEl) {
		wallets.attach(new Parasite({
			renderer: renderWalletOption,
			parent: selectEl
		}));
	});



	// Show list of wallets:
	var walletTbody = qs('.wallet-table tbody');

	function renderWallet(wallet, index) {
		var walletRow = tmp.wallet({
			name: wallet.name,
			balance: formatMoney(wallets[index].balance || 0)
		});
		var editButton = qs('button', walletRow);
		var editForm = qs('form', walletRow);
		var editField = qs('input[type=text]', walletRow);

		on(editButton, 'click', function() {
			var activeEditField;
			if (( activeEditField = qs('input[type=text]:not([disabled])', walletTbody) ) && activeEditField !== editField)
				activeEditField.disabled = true;
			editField.disabled = !editField.disabled;
			if (!editField.disabled) editField.focus();
		});

		// Edit wallet name:
		on(editForm, 'submit', function(event) {
			event.preventDefault();
			walletListParasite.edit(wallet, {name: this.name.value});
		});

		// Remove wallet:
	//	on(qs('.delete', walletRow), 'click', function(event) {
	//		wallets.remove(wallet);
	//	});

		return walletRow;
	}
	var walletListParasite = new Parasite({
		renderer: renderWallet,
		parent: walletTbody
	});
	wallets.attach(walletListParasite);


	// Handle new wallet entries:
	on(qs('.wallet-form'), 'submit', function(event) {
		// Don't submit the form:
		event.preventDefault();

		// Add the wallet:
		wallets.push({
			name: this.title.value,
			balance: 0
		});
	});

})();