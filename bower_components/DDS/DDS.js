/*global define */
(function (root, factory) {
	'use strict';
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['object-subscribe', 'subscribable.js'], factory);
	} else {
		// Browser globals
		root.DDS = factory(root.Obj, root.Subscribable);
	}
})(this, function(Obj, Subscribable) {
	'use strict';

	function uid() {
		return (
			(+(Math.random() + '00').slice(2)).toString(36) + '_' +
			(+(Math.random() + '00').slice(2)).toString(36));
	}

	function appendAtIndex(parent, newChild, index) {
		var nextSibling = parent.children[index];
		parent.insertBefore(newChild, nextSibling);
	}

	// Bind an array of objects to the DOM:
	// var model = new DDS(arrayOfObjects);
	var DDS = function(objects) {
		this.subscribers = {};
		this.objects = [];
		this.objectsObj = {};

		if (Obj.type(objects) === 'object') {
			for (var _id in objects) {
				this.add(objects[_id], _id);
			}
		}
		else (objects || []).forEach(this.add, this);
	};

	DDS.prototype = new Subscribable();
	Obj.extend({
		whenever: function(event, fn) {
			if (event === 'add' || event === 'any') {
				for (var i = 0, l = this.objects.length; i < l; i++) fn(event, this.objects[i]);
			}
			this.on(event, fn);
		},

		add: function(obj, _id) {
			// prep passed object with an _id prop (each object gets a unique ID)
			if (obj._id === undefined) {
				obj._id = _id || uid();
			}

			// ensure the passed object doesn't have a duplicate
			if (this.objectsObj[obj._id]) return;

			// prep passed object with an _ts prop (date created)
			if (obj._ts === undefined) obj._ts = Date.now();

			// add object to this.objects and this.objectsObj
			this.objects.push(obj);
			this.objectsObj[obj._id] = obj;

			// notify subscribers/views
			if (!obj._isDeleted) {
				this.trigger('add', obj);
			}
		},

		edit: function(obj, changes, DDSViewNotToUpdate) {
			var oldObj = Obj.extend(obj);
			obj._lastEdit = Date.now();
			Obj.set(obj, changes);

			// Notify subscribers:
			var operation = obj._isDeleted ? 'remove' : (oldObj._isDeleted ? 'add' : 'edit');
			this.trigger(operation, obj, oldObj, DDSViewNotToUpdate);
		},

		remove: function(obj) {
			this.edit(obj, {_isDeleted: true});
		},

		findAll: function(queryObj) {
			var array = [];
			this.objects.forEach(function(dataObj) {
				for (var key in queryObj) {
					if (queryObj[key] !== dataObj[key]) return;
				}
				array.push(dataObj);
			});
			return array;
		},

		find: function(queryObj) {
			var numObjects = this.objects.length;
			search:
			for (var i = 0; i < numObjects; i++) {
				var dataObj = this.objects[i];
				for (var key in queryObj) {
					if (queryObj[key] !== dataObj[key]) continue search;
				}
				return dataObj;
			}
		},

		// Keep DOM updated with latest data, return passed view
		render: function(view) {
			view.dds = this;
			view.objects = view.getModel();
			view.refresh();

			// keep view updated:
			this.on('add edit remove', view.render.bind(view));

			return view;
		}
	}, DDS.prototype);




	DDS.View = function(options) {
		options = options || {};
		this.subscribers = {};

		// these are set when the `render` method of a DDS instance is called passing this view:
		this.dds = null;
		this.objects = null; // always up to date view model

		this.requiredKeys = options.requiredKeys;
		this.sorter = options.sort || function(array) {
			return array.reverse();
		};
		this.filterer = options.filter || function() {
			return true;
		};
	};

	// Usable DDS Views (e.g., see DDS.DOMView below)
	// should extend DDS.View and add, at minimum, a `refresh` method.
	// For increased performance, include the following methods as well:
	// add(obj, index), remove(obj._id), and sort(fn)
	DDS.View.prototype = new Subscribable();
	Obj.extend({
		getModel: function() {
			var nonDeleted = this.dds.findAll({_isDeleted: undefined});
			return this.sorter(nonDeleted.filter(this.filterer));
		},

		render: function(action, newObj, oldObj, DDSViewNotToUpdate) {
			this.objects = this.getModel();
			if (this === DDSViewNotToUpdate) return;
			var isEdit = action === 'edit';

			// On edit, only update view if a required key changed
			objDiff:
			if (isEdit && this.requiredKeys && this.requiredKeys.length) {
				for (var i = 0, l = this.requiredKeys.length; i < l; i++) {
					var key = this.requiredKeys[i];
					if (newObj[key] !== oldObj[key]) break objDiff;
				}
				return;
			}

			// determine wether view will need to perform an 'add' and/or a 'remove' operation
			if (isEdit || action === 'remove') {
				var shouldRemove = true;
			}
			if ((isEdit || action === 'add') && this.filterer(newObj)) {
				var shouldAdd = true;
			}

			// perform any needed add or remove operations on view
			// use view.refresh if view doesn't have a needed remove/add method
			if (shouldRemove && !this.remove || shouldAdd && !this.add) {
				this.refresh()
			} else {
				if (shouldRemove) {
					this.remove(newObj._id);
				}
				if (shouldAdd) {
					this.add(newObj, this.objects.indexOf(newObj));
				}
			}

			this.trigger(action);
		},

		filter: function(fn) {
			this.filterer = fn;

			if (this.add && this.remove) {
				// grab new view model:
				var newViewModel = this.getModel();

				// remove old objects from view if they're not in new model
				this.objects.forEach(function(object) {
					if (newViewModel.indexOf(object) < 0) {
						this.remove(object._id);
					}
				}, this);

				// update model
				this.objects = newViewModel;

				// add new objects in model to view
				this.objects.forEach(function(object, index) {
					this.add(object, index);
				}, this);
			}
			else this.refresh();

			this.trigger('filter');
		},

		edit: function(obj, changes) {
			this.dds.edit(obj, changes, this);
		}
	}, DDS.View.prototype);




	DDS.DOMView = function(options) {
		Obj.extend(new DDS.View(options), this);
		this.renderer = options.renderer;
		this.parent = options.parent;
		this.elements = {};
	};

	DDS.DOMView.prototype = new DDS.View();
	Obj.extend({
		elFromObject: function(object) {
			return (this.elements[object._id] = this.renderer(object));
		},

		add: function(object, elIndex) {
			if (this.elements[object._id]) return;
			appendAtIndex(this.parent, this.elFromObject(object), elIndex);
		},

		remove: function(_id) {
			var el = this.elements[_id];
			if (!el) return;
			this.parent.removeChild(el);
			delete this.elements[_id];
		},

		emptyParent: function() {
			for (var _id in this.elements) {
				this.parent.removeChild(this.elements[_id]);
			}
			Obj.reset(this.elements);
		},

		renderMultiple: function(array, renderer) {
			var renderedEls = array.map(renderer || this.elFromObject, this);
			var docFrag = document.createDocumentFragment();
			var numEls = renderedEls.length;
			for (var i = 0; i < numEls; i++) docFrag.appendChild(renderedEls[i]);
			this.parent.appendChild(docFrag);
		},

		refresh: function() {
			this.emptyParent();
			this.renderMultiple(this.objects);
		},

		sort: function(fn) {
			this.sorter = fn;
			this.objects = this.sorter(this.objects);
			this.renderMultiple(this.objects, function(object) {
				return this.parent.removeChild(this.elements[object._id]);
			});
			this.trigger('sort');
		}
	}, DDS.DOMView.prototype);

	return DDS;
});