// Update localStorage:
function updateStorage(key) {
	storage.set('TF' + key, window[key]);
}


// Update money total:
var moneyTotal = 0;
var totalEl = qs('.total');
function updateTotal(addend) {
	moneyTotal = stripNum(moneyTotal + addend)
	totalEl.textContent = formatMoney(moneyTotal);
}


// Render transactions:
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

	// Add functionality to delete button:
	on(qs('.delete button', tr), 'click', function() {
		if (confirm('Delete?\n' + transaction.title)) {
			tr.parentNode.removeChild(tr);
			updateTotal(-transaction.amount);
			transactions.remove(transaction);
			updateStorage('transactions');
			updateGraph();
		}
	});

	return tr;
}


// Grab transactions from localStorage (recent last):
var transactions = storage.get('TFtransactions') || [];

// Add transactions to table (recent first):
renderMultiple(transactions, renderTransaction, transactionsTbody);


// Handle new income & payment form entries:
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
		timestamp: ts
	};
	
	// Add the new transaction to the transactions array:
	transactions.push(data);
	// Sort transactions recent last:
	transactions.sort(function(a, b) {
		return a.date - b.date;
	});
	updateStorage('transactions');
	
	// Render the transaction and append to the DOM at the correct index:
	var index = transactions.length - 1 - transactions.indexOf(data);
	var tr = renderTransaction(data);
	appendAtIndex(transactionsTbody, tr, index);
	
	updateGraph();
});
