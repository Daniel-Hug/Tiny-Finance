/* global $, TF, DOM */

(function() {
	'use strict';

	// handle clicks on edit buttons
	function editBtnClick(fieldToToggle, btnToToggle) {
		// toggle disabled state of passed input and passed button
		fieldToToggle.disabled = !fieldToToggle.disabled;
		btnToToggle.disabled = !btnToToggle.disabled;

		// toggle input's focused state
		if (!fieldToToggle.disabled) fieldToToggle.focus();
	}

	function renderWallet(wallet) {
		var formattedBalance = $.formatMoney(wallet.balance || 0);

		var editField = DOM.buildNode({ el: 'input', type: 'text', _className: 'wallet-name-edit-field', _value: wallet.name, name: 'name', _disabled: true });
		var saveBtn = DOM.buildNode({ el: 'button', _className: 'wallet-save-btn', kid: 'save', _disabled: true });
		var walletRow = DOM.buildNode({ el: 'tr', _id: 'wallet_' + wallet._id, kids: [
			{ el: 'td', _className: 'wallet-action-col', kid:
				{ el: 'button', _className: 'icon-pencil', on_click: editBtnClick.bind(null, editField, saveBtn), kid:
					{ el: 'span', _className: 'ir', kid: 'edit' }
				}
			},
			{ el: 'td', kid: {
					el: 'form',
					on_submit: function editFormSubmit(event) {
						event.preventDefault();
						editBtnClick.call(null, editField, saveBtn);
						TF.views.walletList.edit(wallet, {name: this.name.value});
					},
					kids: [editField, saveBtn]
				}
			},
			{ el: 'td', _className: 'wallet-amount-col', kid: formattedBalance }
		] });

		return walletRow;
	}
	TF.renderers.wallet = renderWallet;

})();