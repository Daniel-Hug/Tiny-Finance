// Add wallets to select element in transaction form:
function renderWalletOption(data) {
	return new Option(data.name);
}

wallets.attach(renderWalletOption, qsa('.wallet-select'), true);


// Show list of wallets:
var walletTbody = qs('.wallet-table tbody');

function renderWallet(data, index) {
	var walletRow = tmp.wallet({
		name: data.name,
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
		wallets.edit(data, {name: this.name.value});
	});

	// Remove wallet:
//	on(qs('.delete', walletRow), 'click', function(event) {
//		wallets.remove(data);
//	});

	return walletRow;
}

wallets.attach(renderWallet, walletTbody);


// Handle new wallet entries:
on(qs('.wallet-form'), 'submit', function(event) {
	// Don't submit the form:
	event.preventDefault();

	// Add the wallet:
	wallets.push({
		name: this.title.value,
		balance: 0,
		timestamp: Date.now()
	});
});
