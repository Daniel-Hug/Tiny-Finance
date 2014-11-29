DDS
===

Data/DOM Sync with JS

## How to build a web app with DDS


First, configure your db and DDS model to keep each other updated:

```js
var tasks = new DDS(JSON.parse(localStorage.getItem('tasks')) || []);

var tasks.on('any', function() {
	localStorage.setItem('tasks', JSON.stringify(window.tasks.objects));
});
```


Then you can start rendering the data:

```js
var taskListView = tasks.render(new DDS.DOMView({
	renderer: renderTask,
	parent: taskList,
	requiredKeys: ['done', 'title'] // specify which properties this view uses so it only updates when one of those properties change
}));
```

You can add new "rows" (objects) to your DDS model which will automatically be synced with the db and views:

```js
window.tasks.add({done: false, title: 'take out trash'});
```