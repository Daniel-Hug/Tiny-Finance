/*global DDS */
(function() {
	'use strict';



	/*
		Set up tasks data with localStorage
	*/

	var tasks = window.tasks = new DDS(storage.get('tasks') || [
		{done: false, title: 'Mark \'em off one by one.'},
		{done: false, title: 'Print them off.'},
		{done: false, title: 'Add tasks to your ToDo list.'}
	]);

	tasks.on('any', function() {
		storage.set('tasks', tasks.objects);
	});



	/*
		render task function
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



	/*
		Render task list view
	*/

	var taskListView = tasks.render(new DDS.DOMView({
		renderer: renderTask,
		parent: qs('.task-list'),
		requiredKeys: ['done', 'title']
	}));



	/*
		handle new task submission
	*/

	var taskNameField = qs('.task-name-field');
	on(qs('.new-task-form'), 'submit', instead(function() {
		tasks.add({done: false, title: taskNameField.value});
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

	var filterBtns = qsa('.filter-btns button');
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
				return objectB._ts - objectA._ts; // descending
			});
		},
		newLast: function(array) {
			return array.sort(function(objectA, objectB) {
				return objectA._ts - objectB._ts; // ascending
			});
		}
	};

	var sortBtns = qsa('.sort-btns button');
	[].forEach.call(sortBtns, function(btn) {
		on(btn, 'click', function() {
			[].forEach.call(sortBtns, function(btn) {
				btn.classList.remove('active');
			});
			taskListView.sort(sorters[this.className]);
			this.classList.add('active');
		});
	});

})();
