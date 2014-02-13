// Subscribe to changes on an object:
var Obj = (function(map) {
	function getIndex(obj) {
		for (var i = 0, l = map.length; i < l; i++) {
			if (map[i][0] === obj) return i;
		}
		return -1;
	}

	return {
		has: function(obj, key) {
			return {}.hasOwnProperty.call(obj, key);
		},
		
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

		set: function(obj, keyOrNewObj, value) {
			if (typeof keyOrNewObj === 'string') {
				obj[keyOrNewObj] = value;
				Obj.changed(obj);
			} else Obj.changed(obj, keyOrNewObj);
		},

		unset: function(obj, key) {
			delete obj[key];
			Obj.changed(obj);
		},

		changed: function(obj, newObj) {
			var index = getIndex(obj);
			if (newObj !== undefined) {
				for (var key in newObj) {
					if (Obj.has(newObj, key)) obj[key] = newObj[key];
				}
			}
			if (index === -1) return;
			if (newObj !== undefined) {
				for (var key in newObj) {
					if (Obj.has(obj, key)) map[index][0][key] = obj[key];
				}
			}
			var subscribers = map[index][1],
			numSubscribers = subscribers.length;
			for (var i = 0; i < numSubscribers; i++) {
				subscribers[i](obj);
			}
		}
	};
})([]);


// Insert an object into a sorted array of similar objects.
// Objects are sorted (least to greatest) by the property passed as the third argument.
function sortedIndex(array, value, key) {
	var low = 0,
		high = array.length;

	while (low < high) {
		var mid = (low + high) >>> 1;
		if (array[mid][key] < value[key]) low = mid + 1;
		else high = mid;
	}
	return low;
}


// Bind an array of Data objects to the DOM:
function Arr(storageIDOrArray, def, sortKey) {
	var arr;
	if (typeof storageIDOrArray === 'string') {
		arr = storage.get(storageIDOrArray) || def || [];
		this.storageID = storageIDOrArray;
	}
	else arr = storageIDOrArray;
	[].push.apply(this, arr);
	this.parasites = [];
	if (sortKey) this.sortKey = sortKey;
}

Arr.prototype = {
	length: 0,

	updateStorage: function() {
		if (this.storageID) storage.set(this.storageID, [].slice.call(this));
	},

	push: function(obj, arrIndex) {
		var arrLength = this.length;
		arrIndex = typeof arrIndex === 'number' ? arrIndex :
			(this.sortKey ? sortedIndex(this, obj, this.sortKey) : arrLength);
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
	
	edit: function(obj, keyOrNewObj, value) {
		Obj.set(obj, keyOrNewObj, value);
		this.updateStorage();
		
		// Remove object from array at old index:
		var oldArrIndex = this.indexOf(obj);
		this.splice(oldArrIndex, 1);
		
		// Add object back at new index:
		var newArrIndex = this.sortKey ? sortedIndex(this, obj, this.sortKey) : oldArrIndex;
		this.splice(newArrIndex, 0, obj);

		var arrLength = this.length;
		each(this.parasites, function(parasite) {
			var oldElIndex = parasite.keepOrder ? oldArrIndex : arrLength - 1 - oldArrIndex;
			var newElIndex = parasite.keepOrder ? newArrIndex : arrLength - 1 - newArrIndex;
			parasite.parent.removeChild(parasite.parent.children[oldElIndex]);
			var newChild = parasite.renderer(obj, newArrIndex);
			appendAtIndex(parasite.parent, newChild, newElIndex);
		}, this);
	},

	attach: function(renderer, parents, keepOrder) {
		if (parents.appendChild) parents = [parents];
		each(parents, function(parent) {
			this.parasites.push({
				renderer: renderer,
				parent: parent,
				keepOrder: keepOrder
			});
			renderMultiple(this, renderer, parent, keepOrder);
		}, this);
	},

    indexOf: [].indexOf,

    // Needed to get an array-like
    // representation instead of an object
    splice: [].splice
};