/* 
	Twilio Service to make twilio API calls and send SMS messages
*/
module.exports = exports = function(Q, request){

	var apiEndpoint, credentials, accounts;

    apiEndpoint = 'https://api.twilio.com/2010-04-01/';

    credentials = {
        accountSid: '',
        authToken: ''
    };

    function __initialize(accountSid, authToken){
    	credentials.accountSid = accountSid;
    	credentials.authToken = authToken;
    }

    function __transformRequest(data, getHeaders) {
            return __serializeData(data);
    };

    function __serializeData(data) {
            // If this is not an object, defer to native stringification.
            if (!(typeof data === "object")) {
                return (data === null) ? '' : data.toString();
            }

            var buffer = [];
            // Serialize each key in the object.
            for (var name in data) {
                if (!data.hasOwnProperty(name)) continue;
                var value = data[name];
                buffer.push(
                    encodeURIComponent(name) +
                    '=' +
                    encodeURIComponent((value === null) ? '' : value )
                );
            }

            // Serialize the buffer and clean it up for transportation.
            var source = buffer
                .join('&')
                .replace(/%20/g, '+')
            ;

            return source;
    };

    function __transformResourceUrl = function (url) {
            if (url.substr(-1) === '/')
                url = url.substr(0, url.length - 1);
            return url + '.json';
    };

    function __generateRequest = function (method, resource, data, account) {
            method = method.toUpperCase();

            if (!(typeof account === "string") || account.length < 1)
                account = '_default';
            resource = 'Accounts/' +
                accounts[account] + '/' +
                __transformResourceUrl(resource)
            ;

            var credentialsB64 = new Buffer(credentials.accountSid + ':' + credentials.authToken).toString('base64');

            var requestBody = {
                method: method,
                url: apiEndpoint + resource,
                headers: {
                    'Authorization': 'Basic ' + credentialsB64,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
                }
            };
            if (data) request.data = data;
            if (method !== 'GET' || method !== 'DELETE')
                request.transformRequest = internal.transformRequest;

            return $request(requestBody);
        };


	return {
		init: function(accountSid, authToken){
			__initialize(accountSid, authToken);
		},
		create : function (resource, data, account) {
            return __generateRequest('POST', resource, data, account);
        }
	}
};
