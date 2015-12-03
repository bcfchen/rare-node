var express  = require('express'),
		app  = express(),
    server   = require('http').createServer(app),
     stripe = require('stripe')('sk_test_mJmcYp1rfAiLqgi09pmWpoVT'),
		bodyParser = require('body-parser');
app.use(bodyParser.json({ type: 'application/json' }));

app.set('port', process.env.PINTEREST_STUB_PORT || 3006);
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.header("Access-Control-Allow-Origin", "*");
	next();
});

app.post('/charge', function(req, res){
 var stripeToken = req.body.id;
    var amount = 1000;

    stripe.charges.create({
        card: stripeToken,
        currency: 'usd',
        amount: amount
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

app.get('/status', function(req, res){
    var status = "All Good";
    res.send(200, status);
});

server.listen(app.get('port'), function () {
  require(__dirname + '/document')(app._router.stack);
  console.log('NailArtist payment service listening on port ' + server.address().port);
});
