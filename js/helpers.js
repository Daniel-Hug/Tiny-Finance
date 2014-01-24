/*
	A bunch of Helper functions:
*/

Array.prototype.remove = function(item) {
	this.splice(this.indexOf(item), 1);
	return this;
};


// Get elements by CSS selector:
function $$(selector, scopeEl) {
	return [].slice.call((scopeEl || document).querySelectorAll(selector));
}
function $(selector, scopeEl) {
	return (scopeEl || document).querySelector(selector);
}


(function() { //.on()
	var aELPolyfill = function(eventType, callback) {
		this.attachEvent('on' + eventType, callback);
	};
	
	// Listen to element events:
	Element.prototype.on = Element.prototype.addEventListener || aELPolyfill;
	
	// Listen to window events:
	window.on = window.addEventListener || aELPolyfill;
})();


// localStorage wrapper:
var storage = {
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
var escapeHTML = (function() {
	var entityMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	},
	re = /[&<>"']/g;
	
	return function(str) {
		return String(str).replace(re, function (char) {
			return entityMap[char];
		});
	};
})();


// Templating:
var tmp = {};
(function(regExp) {
	each(qsa('script[type="text/tmp"]'), function(el) {
		var src = el.innerHTML;
		tmp[el.id] = function(data, elName) {
			var newSrc = src.replace(regExp, function(match, key) {
				var numCurlyBraces = match.length - key.length;
				return numCurlyBraces % 2 ? match :
					(numCurlyBraces === 6 ? data[key] : escapeHTML(data[key]));
			});
			if (elName) {
				var el = document.createElement(elName);
				el.innerHTML = newSrc;
				return el;
			}
			return newSrc;
		};
	});
})(/{{{?(\w+)}}}?/g);


// Loop through arr of data objects,
// render each data object as an element with data inserted using the renderer,
// append each element to a documentFragment, and return the documentFragment:
function renderMultiple(arr, renderer) {
	var renderedEls = [].map.call(arr, renderer);
	var docFrag = document.createDocumentFragment();
	for (var i = renderedEls.length; i--;) docFrag.appendChild(renderedEls[i]);
	return docFrag;
}


// DOM insertion:
function prependAInB(newChild, parent) {
	parent.insertBefore(newChild, parent.firstChild);
}

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


// toggleable tabbed panels
$$('.tabbed-panels').forEach(function(parent) {
	var tabs = $$('.tab', parent);
	var panels = $$('.panel', parent);
	var closeable = parent.classList.contains('closeable');
	tabs.forEach(function(tab, i) {
		tab.on('click', function() {
			tabs.forEach(function(tab) {
				if (tab !== this) tab.classList.remove('active');
			}, this);
			
			if (closeable) {
				var isActive = this.classList.toggle('active');
				parent.classList[isActive ? 'add' : 'remove']('active');
			} else {
				this.classList.add('active');
				parent.classList.add('active');
			}
			
			panels.forEach(function(panel, j) {
				panel.classList[j === i ? (closeable ? 'toggle' : 'add') : 'remove']('active');
			});
		});
	});
});

// http://stackoverflow.com/a/3644354/552067
function stripNum(number) {
    return (parseFloat(number.toPrecision(12)));
}

// Convert integer to $$$ format:
// -0.3 -> -$0.30
// 30 -> $30
function formatMoney(int) {
	return int < 0 ?
		'-$' + ( int % 1 ? (-int).toFixed(2) : -int ):
		'$' + ( int % 1 ? int.toFixed(2) : int );
}

// get a Date object from an input[type=date] value:
function parseDashDate(str) {
	return new Date(str.split('-').join('/'));
}

var MS_PER_DAY = 1000 * 60 * 60 * 24;

function timestampInDays(ts) {
	return Math.floor(ts / MS_PER_DAY);
}

function dayToDate(day) {
	return new Date(day * MS_PER_DAY);
}

function daysAgo(day) {
	var days = timestampInDays(Date.now()) - day;
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

// Convert timestamp into a date string looking like this: "Wed, Jun 5, 2013":
function formatDate(date) {
	var parts = new Date(date).toDateString().split(' ');
	parts[0] += ',';
	parts[2] = +parts[2] + ',';
	return parts.join(' ');
}