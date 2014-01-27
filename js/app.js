// Update localStorage:
function updateLocalStorage() {
	storage.set('TFtransactions', transactions);
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
	
	var prettyData = {
		title: transaction.title,
		amount: formatMoney(transaction.amount),
		relativeDate: daysAgo(transaction.date),
		date: formatDate(transaction.date)
	};
	
	var tr = tmp.transaction(prettyData, 'tr');
	
	// Add functionality to delete button:
	var deleteBtn = tr.lastElementChild.firstChild;
	on(deleteBtn, 'click', function() {
		if (confirm('Delete?\n' + transaction.title)) {
			tr.parentNode.removeChild(tr);
			updateTotal(-transaction.amount);
			transactions.remove(transaction);
			updateLocalStorage();
			updateGraph();
		}
	});

	return tr;
}


// Returns an array of 30 arrays.
// The 30 arrays represent the last 30 days.
// The first item in each is that day's timestamp.
// The second item in each is the dollar subtotal for that day.
function subtotalsByDay() {
	var days = transactions.length ? [[
		transactions[0].date,
		transactions[0].amount
	]] : [[startOfDay(), 0]],
	lastDay = days[0], dayDiff;

	function fillGaps(endDate) {
		dayDiff = getDayDiff(lastDay[0], endDate);
		while (dayDiff-- > 0) {
			days.push([
				startOfDay(lastDay[0] + 1.5 * MS_PER_DAY),
				lastDay[1]
			]);
			lastDay = days[days.length - 1];
		}
	}

	// Fill gaps between transactions and calculate subtotals for days with transactions:
	for (var i = 1; i < transactions.length; i++) {
		fillGaps(transactions[i].date);
		lastDay[1] = stripNum(lastDay[1] + transactions[i].amount);
	}

	// Fill gaps between last transaction and today:
	fillGaps(startOfDay());
	
	// Add enough 0 balance days before first transaction to make sure we have 30 days:
	if (days.length < 30) {
		var numToPrepend = 30 - days.length;
		while (numToPrepend-- > 0) {
			days.unshift([
				startOfDay(days[0][0] - 0.5 * MS_PER_DAY),
				0
			]);
		}
	}

	return days;
}


function formatDaysForTable() {
	var days = subtotalsByDay().slice(-30).map(function(day) {
		day[0] = new Date(day[0]);
		return day;
	});

	// Create and populate the data table.
	var data = google.visualization.arrayToDataTable([['Time', 'Net Worth']].concat(days));
	
	// Format date and dollar:
	var dateFormatter   = new google.visualization.DateFormat({ pattern: 'MMM d, y' });
	var dollarFormatter = new google.visualization.NumberFormat({ prefix: '$' });
	dateFormatter.format(data, 0);
	dollarFormatter.format(data, 1);
	
	return data;
}


// Load visualization lib:
google.load('visualization', '1', {
	packages: ['corechart']
});

var graphEl = qs('.graph'),
	graphWrapper = graphEl.parentNode,
	graphData, drawGraph;

function graphInit() {
	googLn = new google.visualization.LineChart(graphEl);

	drawGraph = function drawGraph() {
		googLn.draw(graphData, {
			//curveType: "function",
			width:  graphWrapper.offsetWidth,
			height: graphWrapper.offsetHeight,
			hAxis: { format: 'MMM d' },
			vAxis: { maxValue: 10 },
			legend: { position: 'bottom' }
		});
	};

	updateGraph();
	on(window, 'resize', debounce(drawGraph));
}

function updateGraph() {
	graphData = formatDaysForTable();
	drawGraph();
}


// Grab transactions from localStorage (recent last):
var transactions = storage.get('TFtransactions') || [];


if (transactions.length) {
	// Add transactions to table (recent first):
	transactionsTbody.appendChild(renderMultiple(transactions, renderTransaction));
}

// Set up graph:
google.setOnLoadCallback(graphInit);


// Handle new income & payment form entries:
var paymentForm = qs('.payment-form');
var handleTransactionEntry = function(event) {
	// Don't submit the form:
	event.preventDefault();

	// Grab the transaction from the form:
	var ts = Date.now();
	var dashDate = this.date.value;
	var data = {
		title: this.title.value,
		amount: +this.amount.value,
		date: dashDate ? parseDashDate(dashDate).getTime() : startOfDay(ts),
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
	var tr = renderTransaction(data);
	appendAtIndex(transactionsTbody, tr, index);
	
	updateGraph();
};

// Add form listeners:
on(qs('.income-form'), 'submit', handleTransactionEntry);
on(paymentForm, 'submit', handleTransactionEntry);