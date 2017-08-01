const Influx = require('influx')
const express = require('express')
var http = require('http');
const app = express()

var url= 'http://api.coindesk.com/v1/bpi/currentprice/EUR.json';
var bitcoins = 0.03013318;
var expended = 52.0;

const influx = new Influx.InfluxDB({
  host: '127.0.0.1',
  database: 'cryptocurrencies_db',
  schema: [
    {
      measurement: 'cryptocurrencies_rates',
      fields: {
        exchange: Influx.FieldType.STRING,
        rate_float_usd: Influx.FieldType.FLOAT,
        rate_float_eur: Influx.FieldType.FLOAT,
        amount_owned: Influx.FieldType.FLOAT,
	total_expended: Influx.FieldType.FLOAT
      },
      tags: [
        'currency'
      ]
    }
  ]
})

app.get('/', function (req, result) {
	http.get(url, function(res){
		var body = '';
		res.on('data', function(chunk){
			body += chunk;
		});
		
		res.on('end', function(){
			var cdResponse = JSON.parse(body);
			rate_eur = cdResponse.bpi['EUR'].rate_float;
			rate_usd = cdResponse.bpi['USD'].rate_float;
			console.log("Got a response: ", rate_eur);
			console.log("rate: ", rate_eur);
		        console.log("bitcoins: ", bitcoins);
		        eur_amount = bitcoins * rate_eur;
                        body = "Bitcoins: " + bitcoins + "<br> Rate: " + rate_eur + "<br> Total: " + eur_amount;

			influx.writePoints([
			      {
				        measurement: 'cryptocurrencies_rates',
				        tags: { currency: 'BTC' },
				        fields: { exchange: 'coinbase', rate_float_usd: rate_usd, rate_float_eur: rate_eur, amount_owned: bitcoins, total_expended: expended },
			      }
			 ]).catch(err => {
			      console.error(`Error saving data to InfluxDB! ${err.stack}`)
			 })
			result.send(body);
		});
	}).on('error', function(e){
		console.log("Got an error: ", e);
	});
})

app.listen(8780, function () {
	console.log('Listening on 8780')
})
