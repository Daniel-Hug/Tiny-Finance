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


// An array of the checked wallets (all are checked to start):
var walletFiltersParent = qs('.filter-list');

var changeTransactionFilter = debounce(function() {
	var checkedWallets = [];
	each(qsa('input[type=checkbox]', walletFiltersParent), function(checkbox, walletIndex) {
		if (checkbox.checked) checkedWallets.push(walletIndex);
	});
	var filteredTransactions = [].filter.call(transactions, function(transaction) {
		return checkedWallets.indexOf(transaction.wallet) >= 0;
	});
	renderMultiple(filteredTransactions, renderTransaction, transactionsTbody);
	updateGraph(filteredTransactions);
	updateFullTotal(calculateTotalFromTransactions(filteredTransactions));
}, 10);

function renderWalletFilter(wallet) {
	// Create the checkbox list item:
	var li = document.createElement('li');
	var label = document.createElement('label');
	var checkbox = document.createElement('input');

	checkbox.setAttribute('type', 'checkbox');
	checkbox.checked = true;
	label.textContent = ' ' + wallet.name;
	prependAInB(checkbox, label);
	li.appendChild(label);

	// Filter transactions when a checkbox is clicked:
	on(checkbox, 'change', changeTransactionFilter);

	return li;
}
wallets.attach(renderWalletFilter, walletFiltersParent, true);

// "Toggle Selected" button:
each(qsa('.toggle-check'), function (toggleBtn) {
	on(toggleBtn, 'click', function() {
		each(this.nextElementSibling.children, function (li) {
			var checkbox = li.firstChild.firstChild;
			checkbox.checked = !checkbox.checked;
			changeTransactionFilter();
		});
	});
});


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
