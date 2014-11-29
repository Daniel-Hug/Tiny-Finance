/* global DDS, $, TF, Obj */

(function() {
	'use strict';



	/*=====================*\
	)  Render transactions  (
	\*=====================*/

	var transactionsTbody = $.qs('.transactions');
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

	// Add transactions to table (recent first):
	TF.dataStageTransactions = TF.transactions.render(new DDS.DOMView({
		renderer: renderTransaction,
		parent: transactionsTbody,
		sort: function (transactions) {
			return transactions.sort(function(a, b) {
				return b.date - a.date;
			});
		}
	}));



	/*=================================================*\
	)  Update wallet balances when transactions change  (
	\*=================================================*/

	function addToWallet(walletID, addend) {
		// Update wallet balance:
		if (addend === 0) return;
		var wallet = TF.wallets.objectsObj[walletID];
		TF.wallets.edit(wallet, { balance: $.stripNum(wallet.balance + addend) });
	}


	// update wallet(s) when a transaction is edited, added, deleted, or un-deleted:
	TF.transactions.on('edit', function(event, newObj, oldObj) {
		// edited.
		if (newObj.wallet === oldObj.wallet) {
			// wallet didn't change.
			addToWallet(newObj.wallet, newObj.amount - oldObj.amount);
		} else {
			// wallet changed.
			addToWallet(newObj.wallet, newObj.amount);
			addToWallet(oldObj.wallet, -oldObj.amount);
		}
	});

	TF.transactions.on('add', function(event, newObj) {
		addToWallet(newObj.wallet, newObj.amount);
	});

	TF.transactions.on('remove', function(event, newObj, oldObj) {
		addToWallet(oldObj.wallet, -oldObj.amount);
	});



	/*=====================*\
	)  Create transactions  (
	\*=====================*/

	$.on($.qs('.transaction-form'), 'submit', function(event) {
		// Don't submit the form:
		event.preventDefault();

		// Grab the transaction from the form:
		var formData = $.getFormData(this);
		formData.amount = +formData.amount;
		formData.date = formData.date ? $.parseDashDate(formData.date).getTime() : $.startOfDay();

		// Add the new transaction to the transactions 'array':
		TF.transactions.add(formData);
	});



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