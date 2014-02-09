// Loop through collections:
function each(arr, fn, scope) {
	for (var i = 0, l = arr.length; i < l; i++) {
		fn.call(scope, arr[i], i, arr);
	}
}

function map(arr, fn, scope) {
	var l = arr.length, newArr = [];
	for (var i = 0; i < l; i++) {
		newArr[i] = fn.call(scope, arr[i], i, arr);
	}
	return newArr;
}


// Get elements by CSS selector:
function qs(selector, scope) {
	return (scope || document).querySelector(selector);
}

function qsa(selector, scope) {
	return (scope || document).querySelectorAll(selector);
}


// Add and remove event listeners:
function on(target, type, callback, useCapture) {
	target.addEventListener(type, callback, !!useCapture);
}

function off(target, type, callback, useCapture) {
	target.removeEventListener(type, callback, !!useCapture);
}


// localStorage + JSON wrapper:
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
	
	function getEntity(character) {
		return entityMap[character];
	}
	
	return function(str) {
		return String(str).replace(re, getEntity);
	};
})();


// DOM Templating:
var tmp = {};
[].forEach.call(document.querySelectorAll('[data-tmp]'), function(el) {
	var parent = el.parentNode;
	var parentTagName = parent.tagName;
	var id = el.getAttribute('data-tmp');
	var re = this;
	el.removeAttribute('data-tmp');
	var src = el.outerHTML;
	parent.removeChild(el);
	tmp[id] = function(data) {
		var newSrc = src.replace(re, function(match, key) {
			var numCurlyBraces = match.length - key.length;
			return numCurlyBraces % 2 ? match :
			(numCurlyBraces === 6 ? data[key] : escapeHTML(data[key]));
		});
		var parentClone = document.createElement(parentTagName);
		parentClone.innerHTML = newSrc;
		return parentClone.removeChild(parentClone.firstChild);
	};
}, /\{\{\{?(\w+)\}\}\}?/g);


// DOM rendering helpers:
function removeChilds(parent) {
    var last;
    while (last = parent.lastChild) parent.removeChild(last);
}

function renderMultiple(arr, renderer, parent, keepOrder) {
	if (!arr.length) return;
	var renderedEls = map(arr, renderer),
		docFrag = document.createDocumentFragment(),
		l = renderedEls.length;
	if (keepOrder) for (var i = 0; i < l; i++) docFrag.appendChild(renderedEls[i]);
	else while (l--) docFrag.appendChild(renderedEls[l]);
	removeChilds(parent);
	parent.appendChild(docFrag);
}

function prependAInB(newChild, parent) {
	parent.insertBefore(newChild, parent.firstChild);
}
