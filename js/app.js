/* global DDS, Parasite, dataStageTransactions, dataStage, updateGraph, on, qs, qsa, each, prependAInB, debounce, stripNum, formatMoney, toDashDate */

(function() {
	'use strict';



	/*=============================*\
	)  Grab data from localStorage  (
	\*=============================*/

	// Grab transactions from localStorage (recent last):
	window.transactions = new DDS({
		storageID: 'TFtransactions',
		sortKey: 'date'
	});

	// Grab wallets from localStorage (recent last):
	window.wallets = new DDS({
		storageID: 'TFwallets',
		fallback: [{
			name: 'wallet',
			balance: 0
		}]
	});

	window.dataStage = qs('.data-stage');



	/*=============*\
	)  Money Total  (
	\*=============*/

	window.transactions.subscribe(function(newObj, oldObj) {
		if (oldObj) {
			// edit / remove
			if (newObj._isDeleted) {
				if (oldObj._isDeleted) return;
				// deleted.
				updateTotal(oldObj.wallet, -oldObj.amount);
			} else if (oldObj._isDeleted) {
				// un-deleted.
				updateTotal(newObj.wallet, newObj.amount);
			} else {
				// edited.
				if (newObj.wallet === oldObj.wallet) {
					// wallet didn't change.
					updateTotal(newObj.wallet, newObj.amount - oldObj.amount);
				} else {
					// wallet changed.
					updateTotal(newObj.wallet, newObj.amount);
					updateTotal(oldObj.wallet, -oldObj.amount);
				}
			}
		} else {
			// push
			if (newObj._isDeleted) return;
			updateTotal(newObj.wallet, newObj.amount);
		}
		updateGraph();
	});

	// Update wallet balance and money total:
	function updateTotal(walletID, addend) {
		// Update wallet balance:
		if (addend === 0) return;
		var wallet = window.wallets.find({_id: walletID}),
		walletBalance = wallet.balance || 0;
		window.wallets.edit(wallet, { balance: stripNum(walletBalance + addend) });

		// Update full total:
		updateFullTotal(stripNum(moneyTotal + addend));
	}

	var totalEls = qsa('.total');
	var moneyTotal = 0;
	function updateFullTotal(newTotal) {
		moneyTotal = newTotal;
		each(totalEls, function(el) {
			el.textContent = formatMoney(moneyTotal);
		});
	}

	var filteredTotalEl = qs('.total', dataStage);
	function updateFilteredTotal(moneyTotal) {
		filteredTotalEl.textContent = formatMoney(moneyTotal);
	}

	function calculateTotalFromTransactions(transactions) {
		return [].reduce.call(transactions, function (runningTotal, transaction) {
			return stripNum(runningTotal + transaction.amount);
		}, 0);
	}

	updateFullTotal(calculateTotalFromTransactions(window.transactions));



	/*====================*\
	)  Data Stage Filters  (
	\*====================*/

	// An array of the checked wallets (all are checked to start):
	var walletFiltersParent = qs('.filter-list');
	var walletFilterCheckboxes = walletFiltersParent.getElementsByTagName('input');

	var changeTransactionFilter = debounce(function() {
		var filteredWalletMap = {};
		each(walletFilterCheckboxes, function(checkbox) {
			filteredWalletMap[checkbox.value] = checkbox.checked;
		});
		dataStageTransactions.setFilter(function(transaction) {
			return filteredWalletMap[transaction.wallet];
		});
		updateGraph(dataStageTransactions.filteredArr);
		updateFilteredTotal(calculateTotalFromTransactions(dataStageTransactions.filteredArr));
	}, 10);

	function renderWalletFilter(wallet) {
		// Create the checkbox list item:
		var li = document.createElement('li');
		var label = document.createElement('label');
		var checkbox = document.createElement('input');

		checkbox.setAttribute('type', 'checkbox');
		checkbox.value = wallet._id;
		checkbox.checked = true;
		label.textContent = ' ' + wallet.name;
		prependAInB(checkbox, label);
		li.appendChild(label);

		// Filter transactions when a checkbox is clicked:
		on(checkbox, 'change', changeTransactionFilter);

		return li;
	}
	window.wallets.attach(new Parasite({
		renderer: renderWalletFilter,
		parent: walletFiltersParent,
		keepOrder: true
	}));

	// "Toggle Selected" button:
	each(qsa('.toggle-check'), function (toggleBtn) {
		on(toggleBtn, 'click', function() {
			each(this.nextElementSibling.children, function (li) {
				var checkbox = li.firstChild.firstChild;
				checkbox.checked = !checkbox.checked;
				changeTransactionFilter();
			});
		});
	});



	// Default value for all input[type=date]:
	each(qsa('input[type=date]'), function(dateInput) {
		if (!dateInput.value) dateInput.value = toDashDate(Date.now());
	});

})();