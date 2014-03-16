function appendAtIndex(parent, newChild, index) {
	var nextSibling = parent.children[index];
	parent.insertBefore(newChild, nextSibling);
}


// Debounce function calls:
function debounce(fn, delay, timer) {
	delay = delay || 150;
	return function() {
		var args = arguments,
			context = this;
		clearTimeout(timer);
		timer = setTimeout(function() {
			fn.apply(context, args);
		}, delay);
	};
}


// http://stackoverflow.com/a/3644354/552067
function stripNum(number) {
	return parseFloat(number.toPrecision(12));
}


// Convert integer to $$$ format:
// -0.3 -> -$0.30
// 30 -> $30
function formatMoney(int) {
	return int < 0 ?
		'-$' + ( int % 1 ? (-int).toFixed(2) : -int ):
		'$' + ( int % 1 ? int.toFixed(2) : int );
}



// Date helpers:

// get a Date object from an input[type=date] value:
function parseDashDate(str) {
	return new Date(str.split('-').join('/'));
}

function toDashDate(ts) {
	var local = new Date(ts);
	local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
	return local.toJSON().slice(0,10);
}

var MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(ts) {
	var date = ts ? new Date(ts) : new Date();
	return date.setHours(0,0,0,0);
}

// subtractDay and addDay accept a timestamp or Date object for the start of a day
// and return a timestamp for the start of the previous or next day respectively:
function subtractDay(ts) {
	return startOfDay(ts - 0.5 * MS_PER_DAY);
}
function addDay(ts) {
	return startOfDay(+ts + 1.5 * MS_PER_DAY);
}

function getDayDiff(a, b) {
	return Math.round((b - a) / MS_PER_DAY);
}

function daysAgo(day) {
	var days = getDayDiff(day, startOfDay());
	return days > 0 ?
		(days > 1 ?
			days + ' days ago' :
			'yesterday') :
		(days < 0 ?
			(days < -1 ?
				'in ' + -days + ' days' :
				'tomorrow') :
			'today');
}

// Convert a timestamp or Date object into a string like this: "Wed, Jun 5, 2013"
function formatDate(date) {
	var parts = new Date(date).toDateString().split(' ');
	parts[0] += ',';
	parts[2] = +parts[2] + ',';
	return parts.join(' ');
}
