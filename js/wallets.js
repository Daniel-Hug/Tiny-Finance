/* global DDS, $, TF */

(function() {
	'use strict';



	/*===============================================*\
	)  Add list of wallets to wallet select elements  (
	\*===============================================*/

	function renderWalletOption(data) {
		return new Option(data.name, data._id);
	}

	$.each($.qsa('.wallet-select'), function (selectEl) {
		TF.wallets.render(new DDS.DOMView({
			renderer: renderWalletOption,
			parent: selectEl,
			requiredKeys: ['name']
		}));
	});



	/*=========================*\
	)  render main wallet list  (
	\*=========================*/

	var walletTbody = $.qs('.wallet-table tbody');

	function renderWallet(wallet) {
		var walletRow = $.tmp.wallet({
			name: wallet.name,
			balance: $.formatMoney(wallet.balance || 0)
		});
		var editButton = $.qs('button', walletRow);
		var editForm = $.qs('form', walletRow);
		var editField = $.qs('input[type=text]', walletRow);

		$.on(editButton, 'click', function() {
			var activeEditField;
			if (( activeEditField = $.qs('input[type=text]:not([disabled])', walletTbody) ) && activeEditField !== editField)
				activeEditField.disabled = true;
			editField.disabled = !editField.disabled;
			if (!editField.disabled) editField.focus();
		});

		// Edit wallet name:
		$.on(editForm, 'submit', function(event) {
			event.preventDefault();
			walletListRenderer.edit(wallet, {name: this.name.value});
		});

		// Remove wallet:
	//	on(qs('.delete', walletRow), 'click', function(event) {
	//		wallets.remove(wallet);
	//	});

		return walletRow;
	}

	var walletListRenderer = TF.wallets.render(new DDS.DOMView({
		renderer: renderWallet,
		parent: walletTbody
	}));



	/*================================================*\
	)  Update money total when wallet balances change  (
	\*================================================*/

	var fullTotalEl = $.qs('.full-total');
	var filteredTotalEl = $.qs('.filtered-total', TF.dataStage);
	TF.filteredWalletMap = {};
	TF.moneyTotal = 0;
	TF.filteredMoneyTotal = 0;

	function addToTotal(addend, walletID) {
		if (addend === 0) return;

		// full total
		TF.moneyTotal = $.stripNum(TF.moneyTotal + addend);
		fullTotalEl.textContent = $.formatMoney(TF.moneyTotal);

		// filtered total
		if (!TF.filteredWalletMap[walletID]) return;
		TF.filteredMoneyTotal = $.stripNum(TF.filteredMoneyTotal + addend);
		filteredTotalEl.textContent = $.formatMoney(TF.filteredMoneyTotal);
	}

	TF.wallets.whenever('add', function(event, newObj) {
		TF.filteredWalletMap[newObj._id] = true;
		addToTotal(newObj.balance, newObj._id);
	});

	TF.wallets.on('edit', function(event, newObj, oldObj) {
		addToTotal(newObj.balance - oldObj.balance, oldObj._id);
	});

	TF.wallets.on('remove', function(event, newObj) {
		addToTotal(-newObj.balance, newObj._id);
		delete TF.filteredWalletMap[newObj._id];
	});



	/*========================================================*\
	)  Render wallets in "Filter transactions by wallet" list  (
	\*========================================================*/

	var walletFiltersParent = $.qs('.filter-list');
	function renderWalletFilter(wallet) {
		// Create the checkbox list item:
		var li = document.createElement('li');
		var label = document.createElement('label');
		var checkbox = document.createElement('input');

		checkbox.setAttribute('type', 'checkbox');
		checkbox.value = wallet._id;
		if (TF.filteredWalletMap[wallet._id] === undefined) {
			TF.filteredWalletMap[wallet._id] = true;
		}
		checkbox.checked = TF.filteredWalletMap[wallet._id];
		label.textContent = ' ' + wallet.name;
		$.prependAInB(checkbox, label);
		li.appendChild(label);

		// Filter transactions when a checkbox is clicked:
		$.on(checkbox, 'change', walletFilterChange);

		return li;
	}

	TF.wallets.render(new DDS.DOMView({
		renderer: renderWalletFilter,
		parent: walletFiltersParent,
		sort: function(array) {
			return array;
		}
	}));



	/*=================================*\
	)  Transaction filtering by wallet  (
	\*=================================*/

	var filterTransactions = $.debounce(function() {
		TF.dataStageTransactions.filter(function(transaction) {
			return TF.filteredWalletMap[transaction.wallet];
		});
	}, 10);

	// Keep TF.filteredWalletMap updated when checkboxes are checked/unchecked
	function walletFilterChange() {
		/*jshint validthis: true */
		TF.filteredWalletMap[this.value] = this.checked;
		filterTransactions();
	}

	// "Toggle Selected" button:
	$.each($.qsa('.toggle-check'), function (toggleBtn) {
		$.on(toggleBtn, 'click', function() {
			$.each(this.nextElementSibling.children, function (li) {
				var checkbox = li.firstChild.firstChild;
				checkbox.checked = !checkbox.checked;
				walletFilterChange.call(checkbox);
			});
		});
	});

	TF.dataStageTransactions.on('filter', function() {
		var filteredTotal = 0;
		for (var walletID in TF.filteredWalletMap) {
			if (TF.filteredWalletMap[walletID]) filteredTotal += TF.wallets.objectsObj[walletID].balance;
		}
		filteredTotalEl.textContent = $.formatMoney(TF.filteredMoneyTotal = filteredTotal);
	});




	/*===========================*\
	)  Handle new wallet entries  (
	\*===========================*/

	$.on($.qs('.wallet-form'), 'submit', function(event) {
		// Don't submit the form:
		event.preventDefault();

		// Add the wallet:
		TF.wallets.add({
			name: this.title.value,
			balance: 0
		});
	});

})();