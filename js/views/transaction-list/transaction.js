/* global $, TF, Obj, DOM */

(function() {
	'use strict';



	/*=====================*\
	)  Render transactions  (
	\*=====================*/

	function renderTransaction(transaction) {
		var wallet = TF.wallets.objectsObj[transaction.wallet];

		// format each cell's data and give it a name
		var rowData = {
			title: { kid: transaction.title },
			amount: { kid: $.formatMoney(transaction.amount) },
			date: { kid: $.daysAgo(transaction.date), title: $.formatDate(transaction.date) },
			wallet: { kid: wallet.name, _className: 'wallet' }
		};

		// build dom for enabled data cells
		var dataCells = TF.settings.transactionTableCols.map(function(cellName) {
			var cellData = rowData[cellName];
			cellData.el = 'td';
			return DOM.buildNode(cellData);
		});

		// build dom for row & add listeners to buttons
		var tr = DOM.buildNode({ el: 'tr', id: 'transaction_' + transaction._id, kids: dataCells.concat([
			{ el: 'td', _className: 'actions', kids: [
				{ el: 'button', _className: 'edit icon-pencil', on_click: function() {
					startEdit(transaction);
				} },
				{ el: 'button', _className: 'delete icon-remove', on_click: function() {
					if (confirm('Delete?\n' + transaction.title)) {
						TF.transactions.remove(transaction);
					}
				} }
			] }
		]) });

		Obj.subscribe(wallet, function(wallet) {
			$.qs('.wallet', tr).textContent = wallet.name;
		});

		return tr;
	}
	TF.renderers.transaction = renderTransaction;



	/*===================*\
	)  Edit transactions  (
	\*===================*/

	var transactionEditForm = $.qs('form.transaction-edit');

	TF.dataStage = $.qs('.data-stage');
	var editTab = $.qs('.edit-tab', TF.dataStage);
	var tableTab = $.qs('.table-tab', TF.dataStage);
	$.on($.qs('.close-icon', editTab), 'click', function(event) {
		event.stopPropagation();
		endEdit();
	});

	var transactionBeingEdited;
	function startEdit(transaction) {
		transactionBeingEdited = transaction;
		var transactionBeingEditedClone = Obj.extend(transaction);

		// Stick the transaction data in the edit form:
		transactionBeingEditedClone.date = $.toDashDate(transactionBeingEditedClone.date);
		$.setFormData(transactionEditForm, transactionBeingEditedClone);

		editTab.hidden = false;
		editTab.click();
	}

	function endEdit() {
		editTab.hidden = true;
		tableTab.click();
	}

	$.on(transactionEditForm, 'submit', function(event) {
		// Don't submit the form:
		event.preventDefault();

		// Grab the transaction from the form:
		var formData = $.getFormData(this);
		formData.amount = +formData.amount;
		formData.date = formData.date ? $.parseDashDate(formData.date).getTime() : transactionBeingEdited.date;

		// Replace old transaction object with new:
		TF.transactions.edit(transactionBeingEdited, formData);

		endEdit();
	});

})();