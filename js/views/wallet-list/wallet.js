/* global $, TF, DOM */

(function() {
	'use strict';

	// handle clicks on edit buttons
	function editBtnClick(fieldToToggle) {
		// disable all but fieldToToggle
		$.each($.qsa('input', TF.views.walletList.parent), function(field) {
			if (field === fieldToToggle) return;
			if (!field.disabled) field.disabled = true;
		});

		// toggle fieldToToggle's disabled/focused state
		fieldToToggle.disabled = !fieldToToggle.disabled;
		if (!fieldToToggle.disabled) fieldToToggle.focus();
	}

	function renderWallet(wallet) {
		var formattedBalance = $.formatMoney(wallet.balance || 0);

		var editField = DOM.buildNode({ el: 'input', type: 'text', _value: wallet.name, name: 'name', _disabled: true });
		var walletRow = DOM.buildNode({ el: 'tr', _id: 'wallet_' + wallet._id, kids: [
			{ el: 'td', kid:
				{ el: 'button', _className: 'icon-pencil', on_click: editBtnClick.bind(null, editField), kid:
					{ el: 'span', _className: 'ir', kid: 'edit' }
				}
			},
			{ el: 'td', kid:
				{ el: 'form', kid: editField, on_submit: function editFormSubmit(event) {
					event.preventDefault();
					TF.views.walletList.edit(wallet, {name: this.name.value});
				} }
			},
			{ el: 'td', kid: formattedBalance }
		] });

		return walletRow;
	}
	TF.renderers.wallet = renderWallet;

})();