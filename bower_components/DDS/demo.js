/*global DDS, Firebase */
(function() {
	'use strict';


	/*
		Helper functions
	*/

	// Get elements by CSS selector:
	function qs(selector, scope) {
		return (scope || document).querySelector(selector);
	}
	function qsa(selector, scope) {
		return (scope || document).querySelectorAll(selector);
	}

	function on(target, type, callback) {
		target.addEventListener(type, callback, false);
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
	var fbHasTasks = false;

	fbTasks.on('child_added', function(snapshot) {
		fbHasTasks = true;
		var fbObj = snapshot.val();
		var localObj = window.tasks[fbObj._id];

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
		var localObj = window.tasks.objects[fbObj._id];

		window.tasks.edit(localObj, fbObj);
	});

	// Update Firebase with new merged data:
	fbTasks.once('value', function() {
		if (!fbHasTasks) {
			[
				{done: false, title: 'Mark em\' off one by one.'},
				{done: false, title: 'Print them off.'},
				{done: false, title: 'Add tasks to your ToDo list.'}
			].forEach(window.tasks.add, window.tasks);
		}
		fbTasks.update(window.tasks.objects);

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

		function renderTask(taskObj) {
			// Create elements:
			var li = document.createElement('li');
			var checkbox = document.createElement('input');
			var label = document.createElement('label');
			var checkboxDiv = document.createElement('div');
			var deleteBtn = document.createElement('button');
			var titleWrap = document.createElement('div');
			var title = document.createElement('div');
			checkbox.className = 'visuallyhidden';
			checkboxDiv.className = 'checkbox';
			deleteBtn.className = 'icon-trash';
			titleWrap.className = 'title';

			// Add data:
			checkbox.type = 'checkbox';
			if (taskObj.done) checkbox.checked = true;
			title.textContent = taskObj.title;

			// Append children to li:
			titleWrap.appendChild(title);
			label.appendChild(checkbox);
			label.appendChild(checkboxDiv);
			label.appendChild(deleteBtn);
			label.appendChild(titleWrap);
			li.appendChild(label);

			// Allow changes to ToDo title:
			title.contentEditable = true;
			on(title, 'input', function() {
				taskListRenderer.edit(taskObj, {title: this.textContent});
			});

			// Don't toggle checkbox when todo title or delete button is clicked:
			[titleWrap, deleteBtn].forEach(function(el) {
				on(el, 'click', function(event) {
					event.preventDefault();
					event.stopPropagation();
				});
			});

			on(deleteBtn, 'click', function() {
				window.tasks.remove(taskObj);
			});

			// Let ToDos be checked off:
			on(checkbox, 'change', function() {
				window.tasks.edit(taskObj, {done: this.checked});
			});

			return li;
		}


		var taskListRenderer = window.tasks.render(new DDS.DOMRenderer({
			renderer: renderTask,
			parent: taskList,
			requiredKeys: ['done', 'title']
		}));


		// add task
		on(newTaskForm, 'submit', function(event) {
			event.preventDefault();
			window.tasks.add({done: false, title: taskNameField.value});
			taskNameField.value = '';
		});



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
				taskListRenderer.filter(filters[this.textContent]);
				this.classList.add('active');
			});
		});



		/*
			Sorting
		*/

		var sorters = {
			newFirst: function(array) {
				return array.reverse();
			},
			newLast: function(array) {
				return array;
			}
		};

		var sortBtns = qsa(':scope .sort-btns button', parent);
		[].forEach.call(sortBtns, function(btn) {
			on(btn, 'click', function() {
				[].forEach.call(sortBtns, function(btn) {
					btn.classList.remove('active');
				});
				taskListRenderer.sort(sorters[this.className]);
				this.classList.add('active');
			});
		});

		return taskListRenderer;
	}

	window.renderers = [qs('.left'), qs('.right')].map(init);

})();
