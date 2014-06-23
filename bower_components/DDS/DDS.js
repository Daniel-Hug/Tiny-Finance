(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['object-subscribe', 'subscribable.js'], factory);
    } else {
        // Browser globals
        root.DDS = factory(root.Obj, root.Subscribable);
    }
})(this, function(Obj, Subscribable) {
	'use strict';

	function pad(n, width, z) {
		z = z || '0';
		n = n + '';
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}

	function uid() {
		return (+(Math.random() + '00').slice(2)).toString(36);
	}

	function chronUID() {
		return pad(Date.now().toString(36), 9) + '_' + uid();
	}

	function appendAtIndex(parent, newChild, index) {
		var nextSibling = parent.children[index];
		parent.insertBefore(newChild, nextSibling);
	}

	// Bind an array of Data objects to the DOM:
	var DDS = function(objects) {
		Obj.extend(new Subscribable(), this);
		this.objects = {};

		var array = objects || [];
		if (Obj.type(objects) === 'object') {
			array = this.select.call({objects: objects}, {});
		}
		array.forEach(this.add, this);
	};

	DDS.prototype = new Subscribable();
	Obj.extend({
		whenever: function(event, fn) {
			if (event === 'add' || event === 'any') {
				for (var _id in this.objects) fn(event, this.objects[_id]);
			}
			this.on(event, fn);
		},

		add: function(obj) {
			obj._id = obj._id || chronUID();
			if (this.objects[obj._id]) return;
			if (obj._ts === undefined) obj._ts = Date.now();
			this.objects[obj._id] = obj;

			// Notify subscribers:
			if (!obj._isDeleted) {
				this.trigger('add', obj);
			}
		},

		edit: function(obj, changes, DDSRendererNotToUpdate) {
			var oldObj = Obj.extend(obj);
			obj._lastEdit = Date.now();
			Obj.set(obj, changes);

			// Notify subscribers:
			var operation = obj._isDeleted ? 'remove' : (oldObj._isDeleted ? 'add' : 'edit');
			this.trigger(operation, obj, oldObj, DDSRendererNotToUpdate);
		},

		remove: function(obj) {
			this.edit(obj, {_isDeleted: true});
		},

		select: function(queryObj) {
			var array = [];
			loop:
			for (var _id in this.objects) {
				var dataObj = this.objects[_id];
				for (var key in queryObj) {
					if (queryObj[key] !== dataObj[key]) continue loop;
				}
				array.push(dataObj);
			}
			return array;
		},

		// Keep DOM updated with latest data, return renderer
		render: function(Renderer) {
			Renderer.dds = this;
			Renderer.refresh();

			// keep view updated:
			this.on('add edit remove', Renderer.render.bind(Renderer));

			return Renderer;
		}
	}, DDS.prototype);






	DDS.Renderer = function(options) {
		options = options || {};
		Obj.extend(new Subscribable(), this);
		this.requiredKeys = options.requiredKeys;
		this.sorter = options.sort || function(array) {
			return array.reverse();
		};
		this.filterer = options.filter || function() {
			return true;
		};
	};

	// These are the base methods of DDS.Renderer instances.
	// Usable DDS Renderers should extend the base DDS.Renderer with the following methods:
	// add(obj, index), remove(obj._id), refresh(), sort(fn)
	DDS.Renderer.prototype = new Subscribable();
	Obj.extend({
		render: function(action, newObj, oldObj, DDSRendererNotToUpdate) {
			if (this === DDSRendererNotToUpdate) return;
			var isEdit = action === 'edit';

			// On edit, only update view if a required key changed
			// while loop (labeled "w") only runs once
			w:
			while (isEdit && this.requiredKeys && this.requiredKeys.length) {
				for (var i = 0, l = this.requiredKeys.length; i < l; i++) {
					var key = this.requiredKeys[i];
					if (newObj[key] !== oldObj[key]) break w;
				}
				return;
			}

			if (isEdit || action === 'remove') {
				this.remove(newObj._id);
			}
			if (isEdit || action === 'add') {
				if (!this.filterer(newObj)) return;
				this.add(newObj, this.getArray().indexOf(newObj));
			}
			this.trigger(action);
		},

		getArray: function() {
			var nonDeletedArr = this.dds.select({_isDeleted: undefined});
			return this.sorter(nonDeletedArr.filter(this.filterer));
		},

		filter: function(fn) {
			this.filterer = fn;

			// refresh view:
			var nonDeletedArr = this.dds.select({_isDeleted: undefined});
			var displayArray = this.sorter(nonDeletedArr.filter(this.filterer));

			nonDeletedArr.forEach(function(object) {
				var elIndex = displayArray.indexOf(object);
				if (elIndex >= 0) {
					this.add(object, elIndex);
				} else {
					this.remove(object._id);
				}
			}, this);
			this.trigger('filter');
		},

		edit: function(obj, changes) {
			this.dds.edit(obj, changes, this);
		}
	}, DDS.Renderer.prototype);





	DDS.DOMRenderer = function(options) {
		Obj.extend(new DDS.Renderer(options), this);
		this.renderer = options.renderer;
		this.parent = options.parent;
		this.elements = {};
	};

	DDS.DOMRenderer.prototype = new DDS.Renderer();
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

		renderMultiple: function(array) {
			var renderedEls = array.map(this.elFromObject, this);
			var docFrag = document.createDocumentFragment();
			var numEls = renderedEls.length;
			for (var i = 0; i < numEls; i++) docFrag.appendChild(renderedEls[i]);
			this.parent.appendChild(docFrag);
		},

		refresh: function() {
			this.emptyParent();
			this.renderMultiple(this.getArray());
		},

		sort: function(fn) {
			this.sorter = fn;

			// reorder elements, Fix: this may not be the most efficient method:
			this.getArray().forEach(function(object) {
				this.parent.appendChild(this.parent.removeChild(this.elements[object._id]));
			}, this);
			this.trigger('sort');
		}
	}, DDS.DOMRenderer.prototype);

	return DDS;
});