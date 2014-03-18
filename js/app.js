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
	updateFullTotal(stripNum(moneyTotal + addend));
}

var totalEls = qsa('.total');
function updateFullTotal(moneyTotal) {
	each(totalEls, function(el) {
		el.textContent = formatMoney(moneyTotal);
	});
}

function calculateTotalFromTransactions(transactions) {
	return [].reduce.call(transactions, function (runningTotal, transaction) {
		return stripNum(runningTotal + transaction.amount);
	}, 0);
}

updateFullTotal(calculateTotalFromTransactions(transactions));



// Default value for all input[type=date]:
each(qsa('input[type=date]'), function(dateInput) {
	if (!dateInput.value) dateInput.value = toDashDate(Date.now());
});