// Grab transactions from localStorage (recent last):
var transactions = new Arr('TFtransactions', null, 'date');


// Update money total:
var moneyTotal = 0;
var totalEl = qs('.total');
function updateTotal(addend) {
	moneyTotal = stripNum(moneyTotal + addend);
	totalEl.textContent = formatMoney(moneyTotal);
}


// Render transactions to table:
var transactionsTbody = qs('.transactions');
function renderTransaction(transaction) {
	updateTotal(transaction.amount);

	var tr = tmp.transaction({
		title: transaction.title,
		amount: formatMoney(transaction.amount),
		relativeDate: daysAgo(transaction.date),
		date: formatDate(transaction.date),
		wallet: wallets[transaction.wallet].name
	});

	Obj.subscribe(wallets[transaction.wallet], function(wallet) {
		qs('.wallet', tr).textContent = wallet.name
	});

	// Edit:
	on(qs('.actions .edit', tr), 'click', function() {
		startEdit(transaction);
	});

	// Delete:
	on(qs('.actions .delete', tr), 'click', function() {
		if (confirm('Delete?\n' + transaction.title)) {
			transactions.remove(transaction);
			updateTotal(-transaction.amount);
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
	var data = {
		title: this.title.value,
		wallet: this.wallet.selectedIndex,
		amount: +this.amount.value,
		date: dashDate ? parseDashDate(dashDate).getTime() : startOfDay(ts),
		timestamp: ts,
		edits: []
	};

	// Add the new transaction to the transactions array:
	transactions.push(data);

	updateGraph();
});




// Edit transactions

var transactionEditForm = qs('form.transaction-edit');

var editTab = qs('.data-stage .tabs .edit-tab');
var tableTab = qs('.data-stage .tabs .table-tab');
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

	updateTotal(-transactionBeingEdited.amount);

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