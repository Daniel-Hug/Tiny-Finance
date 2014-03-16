// Grab transactions from localStorage (recent last):
var transactions = new Arr({
	storageID: 'TFtransactions', 
	sortKey: 'date'
});

// Grab wallets from localStorage (recent last):
var wallets = new Arr({
	storageID: 'TFwallets',
	fallback: [{
		name: 'wallet',
		balance: 0,
		timestamp: Date.now()
	}]
});


// Update wallet balance and money total:
function updateTotal(walletIndex, addend) {
	// Update wallet balance:
	var walletBalance = wallets[walletIndex].balance || 0;
	wallets.edit(wallets[walletIndex], {
		balance: stripNum(walletBalance + addend)
	});

	// Update full total:
	moneyTotal = stripNum(moneyTotal + addend);
	updateFullTotal();
}

var moneyTotal = [].reduce.call(transactions, function (runningTotal, transaction) {
	return stripNum((runningTotal.amount || runningTotal) + transaction.amount);
});

var totalEls = qsa('.total');
function updateFullTotal() {
	each(totalEls, function(el) {
		el.textContent = formatMoney(moneyTotal);
	});
}
updateFullTotal();


// Render transactions to table:
var transactionsTbody = qs('.transactions');
function renderTransaction(transaction) {
	var tr = tmp.transaction({
		title: transaction.title,
		timestamp: transaction.timestamp,
		amount: formatMoney(transaction.amount),
		relativeDate: daysAgo(transaction.date),
		date: formatDate(transaction.date),
		wallet: wallets[transaction.wallet].name
	});

	Obj.subscribe(wallets[transaction.wallet], function(wallet) {
		qs('.wallet', tr).textContent = wallet.name;
	});

	// Edit:
	on(qs('.actions .edit', tr), 'click', function() {
		startEdit(transaction);
	});

	// Delete:
	on(qs('.actions .delete', tr), 'click', function() {
		if (confirm('Delete?\n' + transaction.title)) {
			transactions.remove(transaction);
			updateTotal(walletIndex, -transaction.amount);
			updateGraph();
		}
	});

	return tr;
}

// Add transactions to table (recent first):
transactions.attach(renderTransaction, transactionsTbody);


// Handle new transaction form entries:
on(qs('.transaction-form'), 'submit', function(event) {
	// Don't submit the form:
	event.preventDefault();

	// Grab the transaction from the form:
	var ts = Date.now();
	var dashDate = this.date.value;
	var transaction = {
		title: this.title.value,
		wallet: this.wallet.selectedIndex,
		amount: +this.amount.value,
		date: dashDate ? parseDashDate(dashDate).getTime() : startOfDay(ts),
		timestamp: ts,
		edits: []
	};

	// Add the new transaction to the transactions array:
	transactions.push(transaction);
	updateTotal(transaction.wallet, transaction.amount);

	updateGraph();
});




// Edit transactions

var transactionEditForm = qs('form.transaction-edit');

var editTab = qs('.data-stage .edit-tab');
var tableTab = qs('.data-stage .table-tab');
on(qs('.close-icon', editTab), 'click', function(event) {
	event.stopPropagation();
	stopEdit();
});

var transactionBeingEdited;
function startEdit(transaction) {
	transactionBeingEdited = transaction;

	// Stick the transaction data in the edit form:
	transactionEditForm.title.value = transactionBeingEdited.title;
	transactionEditForm.wallet.value = wallets[transactionBeingEdited.wallet].name;
	transactionEditForm.amount.value = transactionBeingEdited.amount;
	transactionEditForm.date.value = toDashDate(transactionBeingEdited.date);

	editTab.hidden = false;
	editTab.click();
}

function stopEdit() {
	editTab.hidden = true;
	tableTab.click();
}

function handleTransactionEdit(event) {
	// Don't submit the form:
	event.preventDefault();

	var edits = transactionBeingEdited.edits ? [].slice.call(transactionBeingEdited.edits) : [];
	delete transactionBeingEdited.edits;
	edits.push(transactionBeingEdited);
	edits = JSON.parse(JSON.stringify(edits));

	// Grab the transaction from the form:
	var ts = Date.now();
	var newData = {
		title: this.title.value,
		wallet: this.wallet.selectedIndex,
		amount: +this.amount.value,
		date: parseDashDate(this.date.value).getTime(),
		timestamp: ts,
		edits: edits
	};

	// Remove money from old wallet and place in new:
	updateTotal(transactionBeingEdited.wallet, -transactionBeingEdited.amount);
	updateTotal(newData.wallet, newData.amount);

	// Replace old transaction object with new:
	transactions.edit(transactionBeingEdited, newData);

	updateGraph();
	stopEdit();
}
on(transactionEditForm, 'submit', handleTransactionEdit);




// Default value for all input[type=date]:
each(qsa('input[type=date]'), function(dateInput) {
	if (!dateInput.value) dateInput.value = toDashDate(Date.now());
});