/* global DDS, $, TF */

(function() {
	'use strict';



	/*==============================================*\
	)  Render transactions to table (recent first):  (
	\*==============================================*/

	TF.views.dataStageTransactions = TF.transactions.render(new DDS.DOMView({
		renderer: TF.renderers.transaction,
		parent: $.qs('.transactions'),
		sort: function(transactions) {
			return transactions.sort(function(a, b) {
				return b.date - a.date;
			});
		}
	}));



	/*==================================*\
	)  render "Filter by wallet" module  (
	\*==================================*/

	// Render wallets in "Filter transactions by wallet" list
	TF.views.walletFilters = new DDS.DOMView({
		renderer: TF.renderers.walletFilter,
		parent: $.qs('.filter-list'),
		sort: function(array) {
			return array;
		}
	});
	TF.views.walletFilters.map = {};
	TF.wallets.render(TF.views.walletFilters);

	// enable "Toggle Selected" button:
	$.on($.qs('.toggle-check'), 'click', function() {
		$.each(this.nextElementSibling.children, function (li) {
			var checkbox = li.firstChild.firstChild;
			checkbox.checked = !checkbox.checked;
			TF.walletFilterChange.call(checkbox);
		});
	});



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



	/*===================================*\
	)  keep filtered money total updated  (
	\*===================================*/

	var filteredTotalEl = $.qs('.transactions-table .total');
	function updateTransactionSum() {
		// sum the balances of the checked wallet-filters
		var filteredTotal = 0;
		for (var walletID in TF.wallets.objectsObj) {
			if (TF.views.walletFilters.map[walletID]) filteredTotal += TF.wallets.objectsObj[walletID].balance;
		}

		// update total
		filteredTotalEl.textContent = $.formatMoney(filteredTotal);
	}

	// update now and whenever a wallet changes:
	updateTransactionSum();
	TF.wallets.on('any', updateTransactionSum);
	TF.views.dataStageTransactions.on('filter', updateTransactionSum);



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