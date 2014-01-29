// Grab wallets from storage:
var wallets = storage.get('TFwallets') || [{
	name: 'wallet',
	timestamp: Date.now()
}];



// Add wallets to select element in transaction form:
function renderWalletOption(data) {
	return new Option(data.name);
}

var walletSelect = qs('.wallet-select');
renderMultiple(wallets, renderWalletOption, walletSelect, true);



// Show list of wallets:
function renderWallet(data) {
	return tmp.wallet(data);
}

var walletList = qs('.wallet-list');
renderMultiple(wallets, renderWallet, walletList);



// Handle new wallet entries:
on(qs('.wallet-form'), 'submit', function(event) {
	// Don't submit the form:
	event.preventDefault();

	// Get option data:
	var data = {
		name: this.title.value,
		timestamp: Date.now()
	};
	
	wallets.push(data);        
	updateStorage('wallets');
	
	// render new wallet to page where needed:
	walletSelect.appendChild(renderWalletOption(data));
	walletList.appendChild(renderWallet(data));
});