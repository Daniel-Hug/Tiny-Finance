// Update localStorage:
function updateLocalStorage() {
	storage.set('TFtransactions', transactions);
}


// Update money total:
var moneyTotal = 0;
var totalEl = $('.total');
function updateTotal(addend) {
	moneyTotal = stripNum(moneyTotal + addend)
	totalEl.textContent = formatMoney(moneyTotal);
}


// Render transactions:
var transactionsTbody = $('.transactions');
function render(transaction) {
	updateTotal(transaction.amount);
	
	var ts = transaction.day * MS_PER_DAY;
	
	var prettyData = {
		title: transaction.title,
		amount: formatMoney(transaction.amount),
		relativeDate: daysAgo(transaction.day),
		date: formatDate(ts)
	};
	
	var tr = tmp.transaction(prettyData, 'tr');
	
	// Add functionality to delete button:
	var deleteBtn = tr.lastElementChild.firstChild;
	deleteBtn.on('click', function() {
		if (confirm('Delete?\n' + transaction.title)) {
			tr.parentNode.removeChild(tr);
			updateTotal(-transaction.amount);
			transactions.remove(transaction);
			updateLocalStorage();
		}
	});

	return tr;
}


// Grab transactions from localStorage (recent last):
var transactions = storage.get('TFtransactions') || [];


// Add transactions to table (recent first):
if (transactions.length) {
	transactionsTbody.appendChild(renderMultiple(transactions, render));
	var transactionsByDay = getTransactionsByDay(transactions);
}


function getTransactionsByDay(transactions) {
	var days = [{
		transactions: [transactions[0]],
		day: transactions[0].day,
		subtotal: transactions[0].amount
	}];

	for (var i = 1; i < transactions.length; i++) {
		var lastDay = days[days.length - 1];
		var day = transactions[i].day;
		var prevDay = lastDay.day;
		var dayDiff = day - prevDay;

		if (dayDiff === 0) {
			lastDay.transactions.push(transactions[i]);
			lastDay.subtotal = stripNum(lastDay.subtotal + transactions[i].amount);
		}
		else if (dayDiff === 1) {
			days.push({
				transactions: [transactions[i]],
				day: transactions[i].day,
				subtotal: transactions[i].amount
			});
		}
		else if (dayDiff > 1) {
			while(--dayDiff) {
				days.push({
					transactions: [],
					day: ++prevDay,
					subtotal: lastDay.subtotal
				});
			}
			days.push({
				transactions: [transactions[i]],
				day: transactions[i].day,
				subtotal: transactions[i].amount
			});
		}
	}
	
	return days;
}


// Load visualization lib:
google.load('visualization', '1', {
	packages: ['corechart']
});

var graphEl = $('.graph'),
	graphWrapper = graphEl.parentNode,
	data, googLn;

function graphInit() {
	// Create and populate the data table.
	data = [['Time', 'Net Worth']].concat(transactionsByDay.slice(-30).map(function(day, i) {
		return [
			new Date(day.day * MS_PER_DAY),
			day.subtotal
		];
	}));
	data = google.visualization.arrayToDataTable(data);

	// Format date and dollar:
	var dateFormatter   = new google.visualization.DateFormat({pattern: 'MMM d, y'});
	var dollarFormatter = new google.visualization.NumberFormat({prefix: '$'});
	dateFormatter.format(data, 0);
	dollarFormatter.format(data, 1);

	googLn = new google.visualization.LineChart(graphEl);
	drawGraph();
	window.on('resize', debounce(drawGraph));
}

function drawGraph() {
	googLn.draw(data, {
		curveType: "function",
		width:  graphWrapper.offsetWidth,
		height: graphWrapper.offsetHeight,
		vAxis: {maxValue: 10}
	});
}

google.setOnLoadCallback(graphInit);


// Handle new income & payment form entries:
var paymentForm = $('.payment-form');
var handleTransactionEntry = function(event) {
	// Don't submit the form:
	event.preventDefault();

	// Grab the transaction from the form:
	var ts = Date.now();
	var dashDate = this.date.value;
	var data = {
		title: this.title.value,
		amount: +this.amount.value,
		day: dashDate ? parseDashDate(dashDate) / MS_PER_DAY : timestampInDays(ts),
		timestamp: ts
	};
	if (this === paymentForm) data.amount = -data.amount;
	
	// Add the new transaction to the transactions array:
	transactions.push(data);
	// Sort transactions recent last:
	transactions.sort(function(a, b) {
		return a.date - b.date;
	});
	updateLocalStorage();
	
	// Render the transaction and append to the DOM at the correct index:
	var index = transactions.length - 1 - transactions.indexOf(data);
	var tr = render(data);
	appendAtIndex(transactionsTbody, tr, index);
};

// Add form listeners:
$('.income-form').on('submit', handleTransactionEntry);
paymentForm.on('submit', handleTransactionEntry);