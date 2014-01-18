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
			updateGraph();
		}
	});

	return tr;
}



function getGraphData() {
	var days = transactions.length ? [[
		transactions[0].day,
		transactions[0].amount
	]] : [],
	lastDay = days[0], dayDiff;

	for (var i = 1; i < transactions.length; i++) {
		dayDiff = transactions[i].day - lastDay[0];
		while(dayDiff--) {
			days.push([
				lastDay[0] + 1,
				lastDay[1]
			]);
			lastDay = days[days.length - 1];
		}
		lastDay[1] = stripNum(lastDay[1] + transactions[i].amount);
	}
	
	var today = timestampInDays(new Date());
	dayDiff = today - lastDay[0];
	while(dayDiff--) {
		days.push([
			lastDay[0] + 1,
			lastDay[1]
		]);
		lastDay = days[days.length - 1];
	}
	
	days = days.slice(-30).map(function(day) {
		day[0] = dayToDate(day[0]);
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

var graphEl = $('.graph'),
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
	window.on('resize', debounce(drawGraph));
}

function updateGraph() {
	graphData = getGraphData();
	drawGraph();
}


// Grab transactions from localStorage (recent last):
var transactions = storage.get('TFtransactions') || [];


if (transactions.length) {
	// Add transactions to table (recent first):
	transactionsTbody.appendChild(renderMultiple(transactions, render));

	// Set up graph:
	google.setOnLoadCallback(graphInit);
}


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
		day: timestampInDays(dashDate ? parseDashDate(dashDate) : ts),
		timestamp: ts
	};
	if (this === paymentForm) data.amount = -data.amount;
	
	var isFirst = !transactions.length;
	
	// Add the new transaction to the transactions array:
	transactions.push(data);
	// Sort transactions recent last:
	transactions.sort(function(a, b) {
		return a.day - b.day;
	});
	updateLocalStorage();
	
	// Render the transaction and append to the DOM at the correct index:
	var index = transactions.length - 1 - transactions.indexOf(data);
	var tr = render(data);
	appendAtIndex(transactionsTbody, tr, index);
	
	if (isFirst) graphInit();
	else updateGraph();
};

// Add form listeners:
$('.income-form').on('submit', handleTransactionEntry);
paymentForm.on('submit', handleTransactionEntry);