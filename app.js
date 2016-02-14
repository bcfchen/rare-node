var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    stripe = require('stripe')('sk_test_ZRz70EBxStjlGr9qqEF7NgWu'),
    sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY || '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'), // temp key for dev
    bodyParser = require('body-parser'),
    firebase = require('firebase'),
    Q = require('Q'),
    request = require('request');
if (process.env.SENDGRID_API_KEY) {
    console.log('Using Production Sendgrid Key');
} else {
    console.log('Using Test Sendgrid Key');
}

var twilioService, twilioAuthService, firebaseUserService, userAuthService;
app.use(bodyParser.json({
    type: 'application/json'
}));

app.set('port', process.env.PORT || 3006);
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.header("Access-Control-Allow-Origin", "*");
    next();
});


app.post('/send-email', function(req, res) {
    var appointment = req.body.appointment,
        user = req.body.user;

    sendgrid.send({
        to: [user.email, 'friend@rarenails.co'],
        from: 'friend@rarenails.co',
        subject: 'Your RARE appointment on ' + appointment.date,
        "sub": { // NOTE duplicate fields, b/c we are sending two copies
            ":firstName": [
                user.firstName,
                user.firstName
            ],
            ":lastName": [
                user.lastName,
                user.lastName
            ],
            ":style": [
                appointment.productName,
                appointment.productName
            ],
            ":date": [
                appointment.date,
                appointment.date
            ],
            ":specialInstructions": [
                user.address.specialInstructions ? user.address.specialInstructions : "None",
                user.address.specialInstructions ? user.address.specialInstructions : "None"
            ],
            ":cardType": [
                user.paymentInfo.brand,
                user.paymentInfo.brand
            ],
            ":cardLastFour": [
                user.paymentInfo.number,
                user.paymentInfo.number
            ],
            ":cardExp": [
                user.paymentInfo.expiry,
                user.paymentInfo.expiry
            ],
            ":price": [
                "$" + appointment.price,
                "$" + appointment.price
            ],
            ":addressLine1": [
                user.address.streetAddress,
                user.address.streetAddress
            ],
            ":addressLine2": [
                user.address.apartmentNumber,
                user.address.apartmentNumber
            ],
            ":addressCity": [
                user.address.city,
                user.address.city
            ],
            ":addressState": [
                user.address.state,
                user.address.state
            ],
            ":addressZip": [
                user.address.zipCode,
                user.address.zipCode
            ],
            ":phoneNumber": [
                user.phoneNumber,
                user.phoneNumber
            ]
        },
        "filters": {
            "templates": {
              "settings": {
                "enable": 1,
                "template_id": "b8ee01fd-9449-4154-88a9-78c6596e687a"
              }
            }
        }
    });
});

app.post('/stripe/charge', function(req, res) {
    var card = req.body.card;
    var amount = req.body.amount;
    var stripeToken = card.id;
    var customerId = req.body.customerId;

    // handle undefined tokenId AND customerId case
    if (!customerId && !stripeToken) {
        res.send(500, "Must provide customerId or tokenId");
    }

    console.log("card ", card);
    console.log("amount ", amount);

    /* if card.id (tokenId) exists and no customerId, this is a new customer, so upsert customer 
       first then create charge
    */
    if (stripeToken && !customerId) {
        upsertStripeCustomer(stripeToken, customerId).then(function(customer) {
            console.log("upserted customer: ", customer);
            stripe.charges.create({
                    customer: customer.id,
                    currency: 'usd',
                    amount: amount,
                    receipt_email: card.email
                },
                function(err, charge) {
                    if (err) {
                        res.send(500, err);
                    } else {
                        console.log("charge", charge);
                        res.send(200, charge);
                    }
                });
        });
    } else {
        /* if card.id does not exist, then this is an existing customer, 
           so create charge directly with customer id
        */
        stripe.charges.create({
                customer: customerId,
                currency: 'usd',
                amount: amount,
                receipt_email: card.email
            },
            function(err, charge) {
                if (err) {
                    res.send(500, err);
                } else {
                    console.log("charge", charge);
                    res.send(200, charge);
                }
            });
    }

});

function upsertStripeCustomer(tokenId, customerId) {
    if (customerId) {
        return stripe.customers.update(customerId, {
            source: tokenId
        }, function(err, customer) {
            // asynchronously called
            console.log("updated customer:", err);
            return err;
        });
    } else {
        console.log("trying with token:", tokenId);
        return stripe.customers.create({
            source: tokenId // obtained with Stripe.js
        }, function(err, customer) {
            // asynchronously called
            console.log("created customer:", err);
            return err;
        });
    }
}

app.get('/stripe/getCustomer/:customerId', function(req, res) {
    try {
        var customerId = req.params && req.params.customerId ? req.params.customerId : undefined;
        if (customerId) {
            stripe.customers.retrieve(
                "customerId",
                function(err, customer) {
                    res.send(200, customer);
                }
            );
        }
    } catch (e) {
        res.status(404).end();
    }
});

/* initialize services */

(function setupTwilioServices() {
    twilioService = require(__dirname + '/services/twilio/twilio-service.js')(Q, request);
    twilioAuthService = require(__dirname + '/services/twilio/twilio-auth-service.js')(Q, twilioService);
    var accountSid = "ACe79928940d39103df64d9bac1fd06a9f",
        authToken = "839a92ea384334275a5871970b5be354",
        fromNumber = '+19252415828';

    twilioService.init(accountSid, authToken);
    twilioAuthService.setFromNumber(fromNumber);
})();

(function setupFirebaseService(){
    firebaseUserService = require(__dirname + '/services/firebase/firebase-user-service.js')(Q, firebase);
    firebaseUserService.setBaseUrl("https://nailartist.firebaseio.com");
})();

(function setupUserAuthService(){
    userAuthService = require(__dirname + '/services/auth/user-auth-service.js')(Q, firebaseUserService, twilioAuthService);
})();

app.post('/auth/get-credentials', function(req, res){
    var phoneNumber = req.body.phoneNumber,
        code = req.body.code;
    userAuthService.login(phoneNumber, code).then(function success(userInfo){
        res.send(200, userInfo);
    }, function error(err){
        res.send(500, err);
    });
});

app.post('/twilio/send-code', function(req, res) {
    var toNumber = req.body.phoneNumber,
        msgBody = req.body.message;

    twilioAuthService.sendCode(toNumber, msgBody).then(function(results) {
        res.send(200, results);
    }, function error(err) {
        res.send(500, err);
    });
});

app.post('/twilio/verify-code', function(req, res) {
    var phoneNumber = req.body.phoneNumber,
        code = req.body.code;

    var isValid = twilioAuthService.verifyCode(phoneNumber, code);
    if (isValid){
        res.send(200, "Validation success");
    } else {
        res.send(422, "Code validation failed");
    }
});

app.get('/status', function(req, res) {
    var status = "All Good";
    res.send(200, status);
});

server.listen(app.get('port'), function() {
    require(__dirname + '/document')(app._router.stack);
    console.log('NailArtist payment service listening on port ' + server.address().port);
});
