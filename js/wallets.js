// Grab wallets from storage:
var wallets = new Arr('TFwallets', [{
	name: 'wallet',
	timestamp: Date.now()
}]);


// Add wallets to select element in transaction form:
function renderWalletOption(data) {
	return new Option(data.name);
}

wallets.attach(renderWalletOption, qs('.wallet-select'), true);


// Show list of wallets:
function renderWallet(data, index) {
	var walletRow = tmp.wallet(data);
	var button = qs('button', walletRow)

	// Edit wallet name:
	on(qs('form.edit', walletRow), 'submit', function(event) {
		event.preventDefault();
		wallets.edit(data, 'name', this.name.value);
	});

	// Remove wallet:
// 	on(qs('.delete', walletRow), 'click', function(event) {
// 		wallets.remove(data);
// 	});

	return walletRow;
}

wallets.attach(renderWallet, qs('.wallet-list'));


// Handle new wallet entries:
on(qs('.wallet-form'), 'submit', function(event) {
	// Don't submit the form:
	event.preventDefault();

	// Get option data:	
	wallets.push({
		name: this.title.value,
		timestamp: Date.now()
	});
});
