/* global $, TF, Obj */

(function() {
	'use strict';



	/*=====================*\
	)  Render transactions  (
	\*=====================*/

	function renderTransaction(transaction) {
		var wallet = TF.wallets.objectsObj[transaction.wallet];
		var formatted = Obj.extend(transaction);
		formatted.amount = $.formatMoney(formatted.amount);
		formatted.relativeDate = $.daysAgo(formatted.date);
		formatted.date = $.formatDate(formatted.date);
		formatted.wallet = wallet.name;

		var tr = $.tmp.transaction(formatted);

		Obj.subscribe(wallet, function(wallet) {
			$.qs('.wallet', tr).textContent = wallet.name;
		});

		// Edit:
		$.on($.qs('.actions .edit', tr), 'click', function() {
			startEdit(transaction);
		});

		// Delete:
		$.on($.qs('.actions .delete', tr), 'click', function() {
			if (confirm('Delete?\n' + transaction.title)) {
				TF.transactions.remove(transaction);
			}
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