// Load visualization lib:
google.load('visualization', '1', {
	packages: ['corechart']
});

var graphEl = qs('.graph'),
	graphWrapper = qs('.data-stage'),
	graphData, drawGraph;

// Set up graph:
google.setOnLoadCallback(graphInit);


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


function graphInit() {
	googLn = new google.visualization.LineChart(graphEl);

	drawGraph = function drawGraph() {
		var dateRange = graphData.getColumnRange(0);
		var dollarRange = graphData.getColumnRange(1);
		var vPadding = Math.ceil((dollarRange.max - dollarRange.min) * 0.02)
		var width = graphWrapper.offsetWidth - 34;
		googLn.draw(graphData, {
			//curveType: "function",
			title: 'Net Worth',
			width:  width,
			height: 0.8 * width,
			hAxis: {
				format: 'MMM d'
				// 1 day before first:
				,minValue: new Date(new Date(dateRange.min.getTime() - MS_PER_DAY / 2).setHours(0,0,0,0))
				// 1 day after last:
				,maxValue: new Date(new Date(dateRange.max.getTime() + MS_PER_DAY * 1.5).setHours(0,0,0,0))
				//,textPosition: 'in'
				,viewWindowMode: 'pretty'
			},
			vAxis: {
				maxValue: dollarRange.max + vPadding
				,minValue: dollarRange.min - vPadding
				//,textPosition: 'in'
			},
			legend: 'none',
			chartArea: {
				top: '8%',
				left: '10%',
				width: '80%',
				height: '86%'
			},
			pointSize: Math.ceil(width / 100)
		});
	};

	updateGraph();
	on(window, 'resize', debounce(drawGraph, 5));
}


function updateGraph() {
	graphData = formatDaysForTable();
	drawGraph();
}