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

// http://stackoverflow.com/a/3644354/552067
function stripNum(number) {
    return (parseFloat(number.toPrecision(12)));
}

// Convert integer to $$$ format
function formatMoney(int) {
	return int < 0 ? '-$' + -int : '$' + int;
}

// get a Date object from an input[type=date] value:
function parseDashDate(str) {
	return new Date(str.split('-').join('/'));
}

function dayDiff(dateA, dateB) {
	return Math.floor((dateB - dateA) / 1000 / 60 / 60 / 24);
}

function daysAgo(date) {
	var days = dayDiff(date, Date.now());
	return days > 0 ? (days > 1 ? days + ' days ago' : 'yesterday') : (days < 0 ? (days < -1 ? 'in ' + -days + ' days' : 'tomorrow') : 'today');
}

// Convert timestamp into a date string looking like this: "Wed, Jun 5, 2013":
function formatDate(date) {
	var parts = new Date(date).toDateString().split(' ');
	parts[0] += ',';
	parts[2] = +parts[2] + ',';
	return parts.join(' ');
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
		tmp[el.id] = function(data, elName) {
			var newSrc = src,
				key;
			for (key in data) {
				newSrc = newSrc.split(open + key + close).join(data[key]);
			}
			if (elName) {
				var el = document.createElement(elName);
				el.innerHTML = newSrc;
				return el;
			}
			return newSrc;
		};
	});
})('{{', '}}');


// Loop through arr of data objects,
// render each data object as an element with data inserted using the renderer,
// append each element to a documentFragment, and return the documentFragment:
function renderMultiple(arr, renderer) {
	var renderedEls = [].map.call(arr, renderer);
	var docFrag = document.createDocumentFragment();
	for (var i = renderedEls.length; --i; docFrag.appendChild(renderedEls[i]));
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