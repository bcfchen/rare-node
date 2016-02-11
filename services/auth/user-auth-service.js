//assorted customer choice factory
module.exports = exports = function(Q, firebaseUserService, twilioAuthService) {
    var baseUrl;

    function __login(phoneNumber, code) {
    	var deferred = Q.defer();
        var isCodeValid = twilioAuthService.verifyCode(phoneNumber, code);
        if (isCodeValid){
        	__getFirebaseAccessData(phoneNumber, code).then(function(credentials){
        		deferred.resolve(credentials);
        	});
        } else {
        	deferred.reject("Invalid verification code");
        }

        return deferred.promise;
    }

    function __getFirebaseAccessData(phoneNumber, code){
    	return firebaseUserService.get(phoneNumber).then(function(password){
    		if (password){
    			return password;
    		} else {
    			console.log("creating user with: ", phoneNumber);
    			return firebaseUserService.create(phoneNumber,code );
    		}
    	});
    }

    return {
        login: __login
    };
};
