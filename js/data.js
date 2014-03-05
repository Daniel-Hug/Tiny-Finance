// Insert an object into a sorted array of similar objects.
// Objects are sorted (least to greatest) by the property passed as the third argument.
function sortedIndex(array, objToInsert, key) {
	var low = 0,
		high = array.length,
		value = objToInsert[key];

	while (low < high) {
		var mid = (low + high) >>> 1;
		if (value >= array[mid][key]) low = mid + 1;
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