/* global $, TF, Firebase, FirebaseSimpleLogin */

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

	var userDrop = $.qs('.user-drop .tab');
	var fbUsers = new Firebase('https://tiny-finance.firebaseio.com/users');

	function mergeLocalAndFBModels(modelNames) {
		// Merge localStorage and Firebase models and update both:
		modelNames.forEach(function(modelName) {
			var fbCollectionRef = window.fbUser.child(modelName);
			var dds = TF[modelName];

			fbCollectionRef.on('child_added', function(snapshot) {
				var fbObj = snapshot.val();
				var localObj = dds[fbObj._id];

				if (localObj) {
					if (fbObj._lastEdit) {
						if ((localObj._lastEdit && fbObj._lastEdit > localObj._lastEdit) || !localObj._lastEdit) {
							dds.edit(localObj, fbObj);
						}
					}
				}
				else dds.add(fbObj);
			});

			fbCollectionRef.on('child_changed', function(snapshot) {
				var fbObj = snapshot.val();
				var localObj = dds.objectsObj[fbObj._id];

				dds.edit(localObj, fbObj);
			});

			// Update Firebase with new merged data:
			fbCollectionRef.once('value', function() {
				fbCollectionRef.update(dds.objectsObj);
			});

			dds.on('any', function(newObj) {
				dds.child(newObj._id).set(newObj);
			});
		});
	}

	var tinyFinanceAuth = new FirebaseSimpleLogin(fbUsers, function(error, user) {
		if (error) {
			console.log(error);
		} else if (user) {
			window.user = user;
			window.fbUser = fbUsers.child(user.email.replace('.', '&'));
			window.fbUser.update({user: user});
			console.log('Welcome ' + user.thirdPartyUserData.given_name + "! You've been logged in.");

			// Show logged-in controls:
			userDrop.textContent = user.displayName;
			document.body.classList.remove('logged-out');
			document.body.classList.add('logged-in');

			mergeLocalAndFBModels(['transactions', 'wallets']);
		} else {
			console.log('User is logged out.');

			// Show logged-out controls:
			document.body.classList.add('logged-out');
			document.body.classList.remove('logged-in');
		}
	});



	// "Sign In with Google" button
	$.on($.qs('.googLoginBtn'), 'click', function () {
		tinyFinanceAuth.login('google');
	});

	// Logout button
	$.on($.qs('.logoutBtn'), 'click', function () {
		tinyFinanceAuth.logout();
	});

})();