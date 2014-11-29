/* global DDS, $, TF, Obj */

(function() {
	'use strict';



	/*==============================================*\
	)  Render transactions to table (recent first):  (
	\*==============================================*/

	var transactionsTbody = $.qs('.transactions');
	TF.dataStageTransactions = TF.transactions.render(new DDS.DOMView({
		renderer: TF.renderers.transaction,
		parent: transactionsTbody,
		sort: function (transactions) {
			return transactions.sort(function(a, b) {
				return b.date - a.date;
			});
		}
	}));



	/*========================================================*\
	)  Render wallets in "Filter transactions by wallet" list  (
	\*========================================================*/

	var walletFiltersParent = $.qs('.filter-list');
	TF.wallets.render(new DDS.DOMView({
		renderer: TF.renderers.walletFilter,
		parent: walletFiltersParent,
		sort: function(array) {
			return array;
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



	/*=================================*\
	)  Transaction filtering by wallet  (
	\*=================================*/

	// "Toggle Selected" button:
	$.each($.qsa('.toggle-check'), function (toggleBtn) {
		$.on(toggleBtn, 'click', function() {
			$.each(this.nextElementSibling.children, function (li) {
				var checkbox = li.firstChild.firstChild;
				checkbox.checked = !checkbox.checked;
				TF.walletFilterChange.call(checkbox);
			});
		});
	});

	// when transactions filter changes, recalculate total:
	var filteredTotalEl = $.qs('.transactions-table .total');
	TF.dataStageTransactions.on('filter', function() {
		var filteredTotal = 0;
		for (var walletID in TF.filteredWalletMap) {
			if (TF.filteredWalletMap[walletID]) filteredTotal += TF.wallets.objectsObj[walletID].balance;
		}
		filteredTotalEl.textContent = $.formatMoney(TF.filteredMoneyTotal = filteredTotal);
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

})();