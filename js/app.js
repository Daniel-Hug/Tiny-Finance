/*jshint browser:true, devel:true */

//(function() {
//	'use strict';	

	// Update localStorage:
	function updateLocalStorage() {
		storage.set('TFtransactions', transactions);
	}
	
	// Update money total:
	var moneyTotal = 0;
	var totalEl = $('.total');
	function updateTotal(addend) {
		var newTotal = moneyTotal += addend;
		totalEl.textContent = formatMoney(newTotal);
	}

	function dayDistance(dateA, dateB) {
		return Math.floor((dateB - dateA) / 1000 / 60 / 60 / 24);
	}

	// Render transactions:
	var transactionsTbody = $('.transactions');
	function render(transaction) {
		updateTotal(transaction.amount);
		
		var prettyData = {
			title: transaction.title,
			amount: formatMoney(transaction.amount),
			relativeDate: daysAgo(transaction.date),
			date: formatDate(transaction.date)
		};
		
		var tr = document.createElement('tr');
		tr.innerHTML = tmp.transaction(prettyData);
		
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


	// Grab and render transactions from localStorage (recent first):
	var transactions = storage.get('TFtransactions') || [];
	if (transactions.length) {

		var TRs = transactions.map(render),
			i = TRs.length,
			TRsFrag = document.createDocumentFragment();
		while (i--) TRsFrag.appendChild(TRs[i]);
		transactionsTbody.appendChild(TRsFrag);
		
		
		
		
		/*
			Create "subtotals" -an array that holds a running total
			balance for each day since the first transaction:
		*/
		
		//var transactionsByDay = [];
		var subtotals = [transactions[0].amount];
		var prevDate = transactions[0].date;
		var runningTotal = transactions[0].amount;
		
		// Look through the transactions (recent first) to find the oldest one within 30 days:
		for (var i = 1; i < transactions.length; i++) {
			
			var date = transactions[i].date;
			runningTotal += transactions[i].amount;
			
			var dayGap = dayDistance(prevDate, date);
			
			if (dayGap > 0) {
				for (var a=0; a < dayGap-1; a++) {
					subtotals.push(subtotals[subtotals.length - 1]);
				}
				subtotals.push(runningTotal);
			} else {
				subtotals[subtotals.length - 1] += runningTotal;
			}
			
			prevDate = date;
		}
		var subtotals30Days = subtotals.slice(-30);
	}


	// Handle new income & payment form entries:
	var paymentForm = $('.payment-form');
	var handleTransactionEntry = function(event) {
		// Don't submit the form:
		event.preventDefault();

		// Grab the transaction from the form:
		var ts = Date.now();
		var data = {
			title: this.title.value,
			amount: +this.amount.value,
			date: this.date.value ? +new Date(this.date.value.split('-').join('/')) : ts,
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
		var index = transactions.indexOf(data);
		var tr = render(data, index);
		transactionsTbody.insertBefore(tr, transactionsTbody.children[transactions.length - index]);
	};
	
	// Add form listeners:
	$('.income-form').on('submit', handleTransactionEntry);
	paymentForm.on('submit', handleTransactionEntry);
	
	
	
	
	var graphEl = $('.graph'), data, googLn,
		graphWrapper = graphEl.parentNode;
	for (var days = [], i = 30; i >= 2; i--) days.push(i + ' days ago');
	days = days.concat(['yesterday', 'today']);
	var months = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(',');
	var dates = [];
	var msInDay = 1000 * 60 * 60 * 24;
	for (var i = 30; i--;) {
		dates.push(new Date(Date.now() - i * msInDay).toDateString().slice(4,-5));
	}

	// Load visualization lib:
	google.load('visualization', '1', {
		packages: ['corechart']
	});
	
	var graphInit = function() {
		// Create and populate the data table.
		data = [['Time', 'Income']].concat(subtotals30Days.map(function(amount, i) {
			var date = new Date(transaction.date);
			return [
				dates[i],
				amount
			];
		}));
		data = google.visualization.arrayToDataTable(data);
		googLn = new google.visualization.LineChart(graphEl);
		drawGraph();
		window.on('resize', debounce(drawGraph));
	};
	
	var drawGraph = function() {
		googLn.draw(data, {
			//curveType: "function",
			width:  graphWrapper.offsetWidth,
			height: graphWrapper.offsetHeight,
			vAxis: {maxValue: 10}
		});
	};

	google.setOnLoadCallback(graphInit);
	
	
//})();