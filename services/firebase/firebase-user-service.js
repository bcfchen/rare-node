//assorted customer choice factory
module.exports = exports = function(Q, Firebase) {
    var baseUrl;
    var RARE_PASSWORD = "rarePassword";

    function __setBaseUrl(url) {
        baseUrl = url;
    }

    function __getPhoneUser(phoneNumber) {
        var deferred = Q.defer();
        var phoneUserRef = new Firebase(baseUrl + "/phoneUsers/" + phoneNumber);

        phoneUserRef.once("value", function(snapshot) {
            var userId = snapshot ? snapshot.val() : snapshot;
            deferred.resolve(userId);
        });

        return deferred.promise;
    }

    function __createPhoneUser(phoneNumber, userId, password) {
        console.log("pcreating phone user with: ", userId);

        var deferred = Q.defer();
        var phoneUserRef = new Firebase(baseUrl + "/phoneUsers/" + phoneNumber);
        phoneUserRef.set(userId, function(err) {
            if (err) {
                console.log("phone user failed with: ", err);

                deferred.reject(err);
            } else {
                console.log("phone user created with: ", userId);
                deferred.resolve(password);
            }
        });

        return deferred.promise;
    }

    function __addUser(phoneNumber, password) {
        var deferred = Q.defer();
        var usersRef = new Firebase(baseUrl + "/users");
        var newUserRef = usersRef.push({
            phoneNumber: phoneNumber,
            password: password
        }, function() {
            console.log("regular user added with: ", newUserRef.key());

            deferred.resolve(newUserRef.key());
        });

        return deferred.promise;
    }

    /* creating registered user in firebase. 
       NOT the same as the users that we store info in
    */
    function __addAuthUser(phoneNumber, userPassword) {
        var deferred = Q.defer();
        var ref = new Firebase(baseUrl + "/users/");
        console.log("creating auth user at:", phoneNumber, userPassword);
        ref.createUser({
            email: phoneNumber + "@rare.com",
            password: userPassword
        }, function(error, userData) {
            if (error) {
                console.log("user created failed: ", error);

                deferred.reject(error);
            } else {
                console.log("user created with: ", userData);
                deferred.resolve(userData);
            }
        });

        return deferred.promise;
    }

    return {
        get: function(phoneNumber) {
            return __getPhoneUser(phoneNumber).then(function(userId) {
                return {
                    id: userId,
                    password: RARE_PASSWORD
                };
            });
        },
        create: function(phoneNumber, code) {
            var password = phoneNumber + "-" + code; 
            console.log("starting firebaseuserservice create:", password);
            return __addAuthUser(phoneNumber, password).then(function(){
                return __addUser(phoneNumber, password);
            }).then(function(userId) {
                return __createPhoneUser(phoneNumber, userId, password);
            });
        },
        setBaseUrl: __setBaseUrl
    }
};
