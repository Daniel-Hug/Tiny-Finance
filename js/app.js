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
			balance: 0,
			timestamp: Date.now()
		}]
	});

	window.dataStage = qs('.data-stage');



	/*=============*\
	)  Money Total  (
	\*=============*/

	// Update wallet balance and money total:
	window.updateTotal = function(walletIndex, addend) {
		// Update wallet balance:
		var wallet = window.wallets[walletIndex],
		walletBalance = wallet.balance || 0;
		window.wallets.edit(wallet, { balance: stripNum(walletBalance + addend) });

		// Update full total:
		updateFullTotal(stripNum(moneyTotal + addend));
	};

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

	var changeTransactionFilter = debounce(function() {
		var checkedWallets = [];
		each(qsa('input[type=checkbox]', walletFiltersParent), function(checkbox, walletIndex) {
			if (checkbox.checked) checkedWallets.push(walletIndex);
		});
		dataStageTransactions.setFilter(function(transaction) {
			return checkedWallets.indexOf(transaction.wallet) >= 0;
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