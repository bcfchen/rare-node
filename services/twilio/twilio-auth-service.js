/* 
    Twilio Service to make twilio API calls and send SMS messages
*/
module.exports = exports = function(Q, twilioService) {

    var opts = {},
        attempts = {};

    function __setFromNumber(number) {
        opts.fromNumber = number;
    }

    function __verifyCode(phoneNumber, code) {
        var correct = attempts[phoneNumber];
        console.log("phoneNumber", phoneNumber);
        console.log("code", code);
        if (code == correct) return true;
        else {
            return false;
        }
    }

    function __generateCode() {
        return Math.floor(Math.random() * 100000);
    };

    function __sendCode(to, body) {
        var deferred = Q.defer(),
            code = __generateCode();

        if (body && body.length > 0)
            body = body + ' ' + code;
        else body = code;

        twilioService.create('Messages', {
            From: opts.fromNumber,
            To: to,
            Body: body
        }).then(function success() {
            attempts[to] = code;
            deferred.resolve(code);
        }, function error() {
            deferred.reject('communication with Twilio failed');

        });

        return deferred.promise;
    }

    return {
        sendCode: __sendCode,
        verifyCode: __verifyCode,
        setFromNumber: __setFromNumber
    }
};
