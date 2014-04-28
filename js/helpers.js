/*global Obj */

(function(){
	'use strict';

	window.ensureType = function(value, expectedType, isOptional) {
		var actualType = Obj.type(value);
		if (isOptional && actualType === 'undefined') return;
		if (String.prototype.indexOf.call(actualType, expectedType) < 0) {
			throw new TypeError("Expected type to be '" + expectedType + "', was '" + actualType + "' instead: ", value);
		}
	};

	window.indexOfKey = function(arr, key) {
		for (var i = 0; i < arr.length; i++) {
			if (Obj.has(arr[i], key)) return i;
		}
	};

	window.appendAtIndex = function(parent, newChild, index) {
		var nextSibling = parent.children[index];
		parent.insertBefore(newChild, nextSibling);
	};


	// Debounce function calls:
	window.debounce = function(fn, delay, timer) {
		delay = delay || 150;
		return function() {
			var args = arguments,
				context = this;
			clearTimeout(timer);
			timer = setTimeout(function() {
				fn.apply(context, args);
			}, delay);
		};
	};


	// http://stackoverflow.com/a/3644354/552067
	window.stripNum = function(number) {
		ensureType(number, 'number')
		return parseFloat(number.toPrecision(12));
	};


	// Convert integer to $$$ format:
	// -0.3 -> -$0.30
	// 30 -> $30
	window.formatMoney = function(int) {
		return int < 0 ?
			'-$' + ( int % 1 ? (-int).toFixed(2) : -int ) :
			'$' + ( int % 1 ? int.toFixed(2) : int );
	};



	// Date helpers:

	window.MS_PER_DAY = 1000 * 60 * 60 * 24;

	// get a Date object from an input[type=date] value:
	window.parseDashDate = function(str) {
		return new Date(str.split('-').join('/'));
	};

	window.toDashDate = function(ts) {
		var local = new Date(ts);
		local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
		return local.toJSON().slice(0,10);
	};

	window.startOfDay = function(ts) {
		var date = ts ? new Date(ts) : new Date();
		return date.setHours(0,0,0,0);
	};

	// subtractDay and addDay accept a timestamp or Date object for the start of a day
	// and return a timestamp for the start of the previous or next day respectively:
	window.subtractDay = function(ts) {
		return window.startOfDay(ts - 0.5 * window.MS_PER_DAY);
	};
	window.addDay = function(ts) {
		return window.startOfDay(+ts + 1.5 * window.MS_PER_DAY);
	};

	window.getDayDiff = function(a, b) {
		return Math.round((b - a) / window.MS_PER_DAY);
	};

	window.daysAgo = function(day) {
		var days = window.getDayDiff(day, window.startOfDay());
		return days > 0 ?
			(days > 1 ?
				days + ' days ago' :
				'yesterday') :
			(days < 0 ?
				(days < -1 ?
					'in ' + -days + ' days' :
					'tomorrow') :
				'today');
	};

	// Convert a timestamp or Date object into a string like this: "Wed, Jun 5, 2013"
	window.formatDate = function(date) {
		var parts = new Date(date).toDateString().split(' ');
		parts[0] += ',';
		parts[2] = +parts[2] + ',';
		return parts.join(' ');
	};
})();
