Array.prototype.remove = function(item) {
	this.splice(this.indexOf(item), 1);
	return this;
};


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
each(qsa('.tabbed-panels'), function(parent) {
	var tabs = qsa('.tab', parent);
	var panels = qsa('.panel', parent);
	var closeable = parent.classList.contains('closeable');
	each(tabs, function(tab, i) {
		on(tab, 'click', function() {
			each(tabs, function(tab) {
				if (tab !== this) tab.classList.remove('active');
			}, this);
			
			if (closeable) {
				var isActive = this.classList.toggle('active');
				parent.classList[isActive ? 'add' : 'remove']('active');
			} else {
				this.classList.add('active');
				parent.classList.add('active');
			}
			
			each(panels, function(panel, j) {
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

function toDashDate(ts) {
    var local = new Date(ts);
    return local.toJSON().slice(0,10);
}

var MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(ts) {
	var date = ts ? new Date(ts) : new Date();
	return date.setHours(0,0,0,0);
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

// Convert timestamp into a date string looking like this: "Wed, Jun 5, 2013":
function formatDate(date) {
	var parts = new Date(date).toDateString().split(' ');
	parts[0] += ',';
	parts[2] = +parts[2] + ',';
	return parts.join(' ');
}
