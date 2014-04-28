/*global on, qs, Firebase, FirebaseSimpleLogin, transactions, wallets */

//
// User authentication with Firebase
//
// Login:
// tinyFinanceAuth.login('google');
//
// Logout:
// tinyFinanceAuth.logout();

(function() {
	'use strict';

	var userDrop = qs('.user-drop .tab');
	var fbUsers = new Firebase('https://tiny-finance.firebaseio.com/users');

	window.resetFBData = function() {
		if (window.fbUser)
			window.fbUser.set({
				transactions: transactions.serialize(),
				wallets: wallets.serialize()
			});
	};

	var tinyFinanceAuth = new FirebaseSimpleLogin(fbUsers, function(error, user) {
		if (error) {
			console.log(error);
		} else if (user) {
			window.user = user;
			console.log('Welcome ' + window.user.thirdPartyUserData.given_name + "! You've been logged in.");

			// Show logged-in controls:
			userDrop.textContent = user.displayName;
			document.body.classList.remove('logged-out');
			document.body.classList.add('logged-in');

			// Update Firebase with all local data:
			window.fbUser = fbUsers.child(user.email.replace('.', '&'));
			window.resetFBData();
		} else {
			console.log('User is logged out.');

			// Show logged-out controls:
			document.body.classList.add('logged-out');
			document.body.classList.remove('logged-in');
		}
	});



	// "Sign In with Google" button
	on(qs('.googLoginBtn'), 'click', function () {
		tinyFinanceAuth.login('google');
	});

	// Logout button
	on(qs('.logoutBtn'), 'click', function () {
		tinyFinanceAuth.logout();
	});

})();