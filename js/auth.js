/*global Obj, on, qs, Firebase, FirebaseSimpleLogin */

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

	function mergeLocalAndFBModels(modelNames) {
		// Merge localStorage and Firebase models and update both:
		modelNames.forEach(function(modelName) {
			var fbCollectionRef = window.fbUser.child(modelName);
			var dds = window[modelName];

			fbCollectionRef.on('child_added', function(snapshot) {
				var _id = snapshot.name();
				var fbObj = snapshot.val();
				fbObj._id = _id;
				var localObj = dds.find({_id: _id});

				if (localObj) {
					if (fbObj._lastEdit) {
						if ((localObj._lastEdit && fbObj._lastEdit > localObj._lastEdit) || !localObj._lastEdit) {
							dds.edit(localObj, fbObj);
						}
					}
				}
				else dds.push(fbObj);
			});

			fbCollectionRef.on('child_changed', function(snapshot) {
				var _id = snapshot.name();
				var fbObj = snapshot.val();
				fbObj._id = _id;
				var localObj = dds.find({_id: _id});

				dds.edit(localObj, fbObj);
			});

			// Update Firebase with new merged data:
			fbCollectionRef.once('value', function() {
				var newCollection = {};
				dds.serialize().forEach(function(obj) {
					obj = Obj.extend(obj);
					var _id = obj._id;
					delete obj._id;
					newCollection[_id] = obj;
				});
				fbCollectionRef.update(newCollection);
			});

			dds.subscribe(function(newObj) {
				var clone = Obj.extend(newObj);
				var _id = clone._id;
				delete clone._id;
				fbCollectionRef.child(_id).set(clone);
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
	on(qs('.googLoginBtn'), 'click', function () {
		tinyFinanceAuth.login('google');
	});

	// Logout button
	on(qs('.logoutBtn'), 'click', function () {
		tinyFinanceAuth.logout();
	});

})();