/*
	A bunch of Helper functions:
*/

// Polyfills:
	// Array#forEach polyfill:
	if (![].forEach) Array.prototype.forEach = function(fn, scope) {
		for (var i = 0, l = this.length; i < l; i++) {
			fn.call(scope, this[i], i, this);
		}
	};

	// Array#map polyfill:
	if(![].map)Array.prototype.map=function(a,s){for(var b=this,c=b.length,d=[],e=0,f;e<b;)d[e]=e in b?a.call(s,b[e],e++,b):f;return d;};

	// Function#bind polyfill:
	if(!open.bind){Function.prototype.bind=function(b){function c(){return d.apply(this instanceof a&&b?this:b,e.concat([].slice.call(arguments)));}function a(){}var e=[].slice.call(arguments,1),d=this;a.prototype=this.prototype;c.prototype=new a();return c;};}


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

function getElIndex(el) {
	return [].indexOf.call(el.parentNode.children, el);
}

// Convert integer to $$$ format
function formatMoney(int) {
	return int < 0 ? '-$' + -int : '$' + int;
}

function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function multiply(val, len) {
	var arr = [];
	while (len--) arr[len] = val;
	return arr;
}

// Capitalize string:
function capitalize(str) {
	return str[0].toUpperCase() + str.slice(1);
}

Date.prototype.startOf = function(unit) {
	var clone = new Date(this.getTime()), day;
	/* */if (unit === 'second') clone.setMilliseconds(0);
	else if (unit === 'minute') clone.setSeconds(0,0);
	else if (unit === 'hour'  ) clone.setMinutes(0,0,0);
	else {
		clone.setHours(0,0,0,0);
		if (unit === 'week') {
			day = clone.getDay();
			clone = day ? new Date(clone - 1000 * 60 * 60 * 24 * day) : clone;
		}
		else if (unit === 'month') clone.setDate(1);
		else if (unit === 'year' ) clone.setMonth(0,1);
	}
	return clone;
};


// Convert timestamp into a date string looking like this: "Wed, Jun 5, 2013":
function formatDate(date) {
	var parts = new Date(date).toDateString().split(' ');
	parts[0] += ',';
	parts[2] = +parts[2] + ',';
	return parts.join(' ');
}

function daysAgo(date) {
	var dayDiff = Math.floor((Date.now() - date) / 1000 / 60 / 60 / 24);
	return dayDiff > 0 ? (dayDiff > 1 ? dayDiff + ' days ago' : 'yesterday') : (dayDiff < 0 ? (dayDiff < -1 ? 'in ' + -dayDiff + ' days' : 'tomorrow') : 'today');
	/*
	return
		dayDiff > 0
			? (dayDiff > 1
				? dayDiff + ' days ago'
				: 'yesterday')
			: (dayDiff < 0
				? (dayDiff < -1
					? 'in ' + -dayDiff + ' days'
					: 'tomorrow')
				: 'today');
	*/
}

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

// Templating:
var tmp = {};
(function(open, close) {
	$$('script[type=tmp]').forEach(function(el) {
		var src = el.innerHTML;
		tmp[el.id] = function(data) {
			var result = src,
				key;
			for (key in data) {
				result = result.split(open + key + close).join(data[key]);
			}
			return result;
		};
	});
})('{{', '}}');

function appendAtIndex(parent, src, index) {
	if ((nextSibling = parent.children[index]))
		nextSibling.insertAdjacentHTML('beforebegin', src);
	else parent.innerHTML = src;
	return parent.children[index];
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