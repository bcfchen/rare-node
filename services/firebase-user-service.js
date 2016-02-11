//assorted customer choice factory
module.exports = exports = function(Firebase, baseUrl) {
	return {
		get : function(phoneNumber){
            var deferred = Q.defer();
			var phoneUserRef = new Firebase(baseUrl + "/phoneUsers/" + phoneNumber);
            phoneUserRef.once("value", function(snapshot){
                var phoneUser = snapshot.val();
                var userRef = new Firebase(baseUrl + "/users/" + phoneUser.userId);
                userRef.once("value", function(snapshot){
                    deferred.resolve(snapshot.val());
                });
            });

            return deferred.promise;
		},
        create : function () {
            return JSON.parse(JSON.stringify(accSearchResult));
        },
        save: function(){

        }



	}
};
