/*global DDS, Firebase */
(function() {
	'use strict';



	/*
		Set up tasks data with localStorage
	*/

	window.tasks = new DDS(storage.get('tasks') || []);

	window.tasks.on('any', function() {
		storage.set('tasks', window.tasks.objects);
	});



	/*
		Firebase
	*/

	var fbTasks = new Firebase('https://js.firebaseio.com/tasks');

	fbTasks.on('child_added', function(snapshot) {
		var fbObj = snapshot.val();
		var localObj = window.tasks.find({_id: fbObj._id});

		if (localObj) {
			if (fbObj._lastEdit) {
				if ((localObj._lastEdit && fbObj._lastEdit > localObj._lastEdit) || !localObj._lastEdit) {
					window.tasks.edit(localObj, fbObj);
				}
			}
		}
		else window.tasks.add(fbObj);
	});

	fbTasks.on('child_changed', function(snapshot) {
		var fbObj = snapshot.val();
		var localObj = window.tasks.find({_id: fbObj._id});

		window.tasks.edit(localObj, fbObj);
	});

	fbTasks.once('value', function() {
		// Add some default tasks if none exist:
		if (!window.tasks.objects.length) {
			[
				{done: false, title: 'Mark \'em off one by one.'},
				{done: false, title: 'Print them off.'},
				{done: false, title: 'Add tasks to your ToDo list.'}
			].forEach(window.tasks.add, window.tasks);
		}

		// Update Firebase with new merged data:
		var objectified = {};
		window.tasks.objects.forEach(function(object) {
			objectified[object._id] = object;
		});
		fbTasks.update(objectified);

		// update Firebase when local model changes:
		window.tasks.on('any', function(event, newObj) {
			fbTasks.child(newObj._id).set(newObj);
		});
	});



	/*
		Create two different todo list views that use the same model
	*/

	function init(parent) {
		var newTaskForm = qs(':scope .new-task-form', parent);
		var taskNameField = qs(':scope .task-name-field', parent);
		var taskList = qs(':scope .task-list', parent);

		/*
			returns an <li> containing all the DOM for a task
			also acts as the control (sets up all the necessary event listeners)
		*/
		function renderTask(taskObj) {
			var li = DOM.buildNode({ el: 'li', kid:
				{ el: 'label', kids: [
					{ el: 'input', type: 'checkbox', _className: 'visuallyhidden', _checked: taskObj.done, on_change: function() {
						tasks.edit(taskObj, {done: this.checked});
					} },
					{ _className: 'checkbox' },
					{ el: 'button', _className: 'icon-trash', on_click: [stopEvent, function() {
						tasks.remove(taskObj);
					}] },
					{ _className: 'title', on_click: stopEvent, kid:
						{ _contentEditable: true, kid: taskObj.title, on_input: function() {
							taskListView.edit(taskObj, {title: this.textContent});
						} }
					}
				] }
			});

			function stopEvent(event) {
				event.preventDefault();
				event.stopPropagation();
			}

			return li;
		}


		var taskListView = window.tasks.render(new DDS.DOMView({
			renderer: renderTask,
			parent: taskList,
			requiredKeys: ['done', 'title']
		}));


		// add task
		on(newTaskForm, 'submit', instead(function() {
			window.tasks.add({done: false, title: taskNameField.value});
			taskNameField.value = '';
		}));



		/*
			Filtering
		*/

		var filters = {
			all: function() {
				return true;
			},
			checked: function(task) {
				return task.done;
			},
			unchecked: function(task) {
				return !task.done;
			}
		};

		var filterBtns = qsa(':scope .filter-btns button', parent);
		[].forEach.call(filterBtns, function(btn) {
			on(btn, 'click', function() {
				[].forEach.call(filterBtns, function(btn) {
					btn.classList.remove('active');
				});
				taskListView.filter(filters[this.textContent]);
				this.classList.add('active');
			});
		});



		/*
			Sorting
		*/

		var sorters = {
			newFirst: function(array) {
				return array.sort(function(objectA, objectB) {
					return objectA._ts - objectB._ts;
				});
			},
			newLast: function(array) {
				return array.sort(function(objectA, objectB) {
					return objectB._ts - objectA._ts;
				});
			}
		};

		var sortBtns = qsa(':scope .sort-btns button', parent);
		[].forEach.call(sortBtns, function(btn) {
			on(btn, 'click', function() {
				[].forEach.call(sortBtns, function(btn) {
					btn.classList.remove('active');
				});
				taskListView.sort(sorters[this.className]);
				this.classList.add('active');
			});
		});

		return taskListView;
	}

	window.views = [qs('.left'), qs('.right')].map(init);

})();
