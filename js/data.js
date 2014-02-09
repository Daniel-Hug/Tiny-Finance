// Subscribe to changes on an object:
var Obj = (function(map) {
	function getIndex(obj) {
		for (var i = 0, l = map.length; i < l; i++) {
			if (map[i][0] === obj) return i;
		}
		return -1;
	}

	return {
		subscribe: function(obj, fn, callNow) {
			var index = getIndex(obj);
			if (index === -1) {
				map.push([obj, []]);
				index = map.length - 1;
			}
			var subscribers = map[index][1];
			if (subscribers.indexOf(fn) === -1) subscribers.push(fn);
			if (callNow) fn(obj);
		},

		unsubscribe: function(obj, arr) {
			if (arr) {
				var subscribers = map[getIndex(obj)][1];
				for (var l = arr.length; l--;) subscribers.splice(subscribers.indexOf(arr[l]), 1);
			}
			else map.splice(getIndex(obj), 1);
		},

		set: function(obj, key, value) {
			obj[key] = value;
			Obj.changed(obj);
		},

		unset: function(obj, key) {
			delete obj[key];
			Obj.changed(obj);
		},

		changed: function(obj) {
			var index = getIndex(obj);
			if (index === -1) return;
			var subscribers = map[index][1],
			numSubscribers = subscribers.length;
			for (var i = 0; i < numSubscribers; i++) {
				subscribers[i](obj);
			}
		}
	};
})([]);


// Bind an array of Data objects to the DOM:
function Arr(storageIDOrArray, def) {
	var arr;
	if (typeof storageIDOrArray === 'string') {
		arr = storage.get(storageIDOrArray) || def || [];
		this.storageID = storageIDOrArray;
	}
	else arr = storageIDOrArray;
	[].push.apply(this, arr);
	this.parasites = [];
}

Arr.prototype = {
	length: 0,

	updateStorage: function() {
		if (this.storageID) storage.set(this.storageID, [].slice.call(this));
	},

	push: function(obj, arrIndex) {
		var arrLength = this.length;
		arrIndex = typeof arrIndex === 'number' ? arrIndex : arrLength;
		this.splice(arrIndex, 0, obj);
		this.updateStorage();
		each(this.parasites, function(parasite) {
			var newChild = parasite.renderer(obj, arrIndex);
			var elIndex = parasite.keepOrder ? arrIndex : arrLength - arrIndex;
			appendAtIndex(parasite.parent, newChild, elIndex);
		});
	},

	remove: function(obj) {
		Obj.unsubscribe(obj);
		var arrIndex = this.indexOf(obj);
		this.splice(arrIndex, 1);
		this.updateStorage();
		each(this.parasites, function(parasite) {
			var elIndex = parasite.keepOrder ? arrIndex : this.length - arrIndex;
			parasite.parent.removeChild(parasite.parent.children[elIndex]);
		}, this);
	},
	
	edit: function(obj, key, value) {
		Obj.set(obj, key, value);
		this.updateStorage();
		var arrIndex = this.indexOf(obj);
		var arrLength = this.length;
		each(this.parasites, function(parasite) {
			var elIndex = parasite.keepOrder ? arrIndex : arrLength - 1 - arrIndex;
			parasite.parent.removeChild(parasite.parent.children[elIndex]);
			var newChild = parasite.renderer(obj, arrIndex);
			appendAtIndex(parasite.parent, newChild, elIndex);
		}, this);
	},

	attach: function(renderer, parent, keepOrder) {
		this.parasites.push({
			renderer: renderer,
			parent: parent,
			keepOrder: keepOrder
		});
		renderMultiple(this, renderer, parent, keepOrder);
	},

    indexOf: [].indexOf,

    // Needed to get an array-like
    // representation instead of an object
    splice: [].splice
};