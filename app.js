var express  = require('express'),
		app  = express(),
    server   = require('http').createServer(app),
     stripe = require('stripe')('sk_live_pIpwOXMlPSL8CbPDdlxLDS3U'),
		bodyParser = require('body-parser');
app.use(bodyParser.json({ type: 'application/json' }));

app.set('port', process.env.PORT || 3006);
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.header("Access-Control-Allow-Origin", "*");
	next();
});

app.post('/charge', function(req, res){
 var card = req.body.card;
 var amount = req.body.amount;
 var stripeToken = card.id;

console.log("card ", card);
console.log("amount ", amount);

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
