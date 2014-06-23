(function(){
	'use strict';

	var $ = window.$ = {};

	// Loop through collections:
	$.each = function(arr, fn, scope) {
		for (var i = 0, l = arr.length; i < l; i++) {
			fn.call(scope, arr[i], i, arr);
		}
	};

	$.map = function(arr, fn, scope) {
		var l = arr.length, newArr = [];
		for (var i = 0; i < l; i++) {
			newArr[i] = fn.call(scope, arr[i], i, arr);
		}
		return newArr;
	};


	// Debounce function calls:
	$.debounce = function(fn, delay, timer) {
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


	// Get element(s) by CSS selector:
	$.qs = function(selector, scope) {
		return (scope || document).querySelector(selector);
	};

	$.qsa = function(selector, scope) {
		return (scope || document).querySelectorAll(selector);
	};


	// Add and remove event listeners:
	$.on = function(target, type, callback, useCapture) {
		target.addEventListener(type, callback, !!useCapture);
	};

	$.off = function(target, type, callback, useCapture) {
		target.removeEventListener(type, callback, !!useCapture);
	};


	// localStorage + JSON wrapper:
	$.storage = {
		get: function(prop) {
			return JSON.parse(localStorage.getItem(prop));
		},
		set: function(prop, val) {
			localStorage.setItem(prop, JSON.stringify(val));
		},
		has: function(prop) {
			return localStorage.hasOwnProperty(prop);
		},
		remove: function(prop) {
			localStorage.removeItem(prop);
		},
		clear: function() {
			localStorage.clear();
		}
	};


	// Make strings safe for innerHTML and attribute insertion (templates):
	$.escapeHTML = (function() {
		var entityMap = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		},
		re = /[&<>"']/g;
		
		function getEntity(character) {
			return entityMap[character];
		}
		
		return function(str) {
			return String(str).replace(re, getEntity);
		};
	})();



	/*
		DOM rendering helpers
	*/

	// DOM Templating:
	$.tmp = {};
	$.each(document.querySelectorAll('[data-tmp]'), function(el) {
		var parent = el.parentNode;
		var parentTagName = parent.tagName;
		var id = el.getAttribute('data-tmp');
		var re = this;
		el.removeAttribute('data-tmp');
		var src = el.outerHTML;
		parent.removeChild(el);
		$.tmp[id] = function(data) {
			var newSrc = src.replace(re, function(match, key) {
				var numCurlyBraces = match.length - key.length;
				return numCurlyBraces % 2 ? match :
				(numCurlyBraces === 6 ? data[key] : $.escapeHTML(data[key]));
			});
			var parentClone = document.createElement(parentTagName);
			parentClone.innerHTML = newSrc;
			return parentClone.removeChild(parentClone.firstChild);
		};
	}, /\{\{\{?(\w+)\}\}\}?/g);

	$.removeChilds = function(parent) {
		var last;
		while ((last = parent.lastChild)) parent.removeChild(last);
	};

	$.renderMultiple = function(arr, renderer, parent, keepOrder) {
		var renderedEls = $.map(arr, renderer),
			docFrag = document.createDocumentFragment(),
			l = renderedEls.length, i;
		if (keepOrder) for (i = 0; i < l; i++) docFrag.appendChild(renderedEls[i]);
		else while (l--) docFrag.appendChild(renderedEls[l]);
		$.removeChilds(parent);
		parent.appendChild(docFrag);
	};

	$.prependAInB = function(newChild, parent) {
		parent.insertBefore(newChild, parent.firstChild);
	};

	$.appendAtIndex = function(parent, newChild, index) {
		var nextSibling = parent.children[index];
		parent.insertBefore(newChild, nextSibling);
	};

	$.getFormData = function(form) {
		var data = {};
		[].forEach.call(form.elements, function(el) {
			if (el.name) data[el.name] = el.value;
		});
		return data;
	};

	$.setFormData = function(form, newData) {
		for (var name in newData) {
			if (form[name]) form[name].value = newData[name];
		}
	};



	/*
		Number helpers
	*/

	$.MS_PER_DAY = 1000 * 60 * 60 * 24;

	// http://stackoverflow.com/a/3644354/552067
	$.stripNum = function(number) {
		return parseFloat(number.toPrecision(12));
	};


	// Convert number to $$$ format:
	// -0.3 -> -$0.30
	// 30 -> $30
	$.formatMoney = function(num) {
		return num < 0 ?
			'-$' + ( num % 1 ? (-num).toFixed(2) : -num ) :
			'$' + ( num % 1 ? num.toFixed(2) : num );
	};



	/*
		Date helpers
	*/

	$.MS_PER_DAY = 1000 * 60 * 60 * 24;

	// get a Date object from an input[type=date] value:
	$.parseDashDate = function(str) {
		return new Date(str.split('-').join('/'));
	};

	$.toDashDate = function(ts) {
		var local = new Date(ts);
		local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
		return local.toJSON().slice(0,10);
	};

	$.startOfDay = function(ts) {
		var date = ts ? new Date(ts) : new Date();
		return date.setHours(0,0,0,0);
	};

	// subtractDay and addDay accept a timestamp or Date object for the start of a day
	// and return a timestamp for the start of the previous or next day respectively:
	$.subtractDay = function(ts) {
		return $.startOfDay(ts - 0.5 * $.MS_PER_DAY);
	};
	$.addDay = function(ts) {
		return $.startOfDay(+ts + 1.5 * $.MS_PER_DAY);
	};

	$.getDayDiff = function(a, b) {
		return Math.round((b - a) / $.MS_PER_DAY);
	};

	$.daysAgo = function(day) {
		var days = $.getDayDiff(day, $.startOfDay());
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
	$.formatDate = function(date) {
		var parts = new Date(date).toDateString().split(' ');
		parts[0] += ',';
		parts[2] = +parts[2] + ',';
		return parts.join(' ');
	};
})();
