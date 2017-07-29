const express = require('express')
var http = require('http');
const app = express()

var url= 'http://api.coindesk.com/v1/bpi/currentprice/EUR.json';
var bitcoins = 0.03013318;

app.get('/', function (req, result) {
	http.get(url, function(res){
		var body = '';
		res.on('data', function(chunk){
			body += chunk;
		});
		
		res.on('end', function(){
			var cdResponse = JSON.parse(body);
			rate = cdResponse.bpi['EUR'].rate_float;
			console.log("Got a response: ", rate);
			console.log("rate: ", rate);
		        console.log("bitcoins: ", bitcoins);
		        eur_amount = bitcoins * rate;
                        body = "Bitcoins: " + bitcoins + "<br> Rate: " + rate + "<br> Total: " + eur_amount;
			result.send(body);
		});
	}).on('error', function(e){
		console.log("Got an error: ", e);
	});
})

app.listen(8780, function () {
	console.log('Listening on 8780')
})
