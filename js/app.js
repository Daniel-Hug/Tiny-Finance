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

	return days.slice(-30);
}


function formatDaysForTable() {
	var days = subtotalsByDay().map(function(day) {
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

// Add transactions to table (recent first):
renderMultiple(transactions, renderTransaction, transactionsTbody);


// Set up graph:
google.setOnLoadCallback(graphInit);


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
