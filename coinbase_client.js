const Influx = require('influx')
const express = require('express')
var http = require('http');
var Client = require('coinbase').Client;
var client = new Client({'apiKey': 'API KEY', 'apiSecret': 'API SECRET'});
const app = express()

var url= 'http://api.coindesk.com/v1/bpi/currentprice/EUR.json';

const cryptocurrencies_db = new Influx.InfluxDB({
  host: '127.0.0.1',
  database: 'cryptocurrencies_dbv2',
  schema: [
    {
      measurement: 'cryptocurrencies_rates',
      fields: {
        rate_float: Influx.FieldType.FLOAT,
      },
      tags: [
	'exchange',
        'crypto_currency',
        'fiat_currency'
      ]
    }
  ]
})

const errors_db = new Influx.InfluxDB({
  host: '127.0.0.1',
  database: 'errors_db',
  schema: [
    {
      measurement: 'errors',
      fields: {
        error_message: Influx.FieldType.STRING,
      },
      tags: [
        'product'
      ]
    }
  ]
})

function getSpotPriceCoinBase(currencyPair, price, err)
{
	if (err == null)
	{
		crypto_currency = currencyPair.split('-')[0];
		fiat_currency = currencyPair.split('-')[1];
		storeRate("coinbase", crypto_currency, fiat_currency, price.data['amount']);
	}else{
		storeError('nodejs:getSpotPriceCoinBase', err); 
	}
}

function getSpotPriceWrapper(exchange, currencyPair)
{
	switch (exchange)
	{
		case 'coinbase':
			client.getSpotPrice({'currencyPair': currencyPair},function(err, price) {getSpotPriceCoinBase(currencyPair, price, err);});
			break;
		default:
			getSpotPriceCoinBase(currencyPair);
	}
}

function storeError(product, error_message)
{
        errors_db.writePoints([
        {
                measurement: 'errors',
                tags: { product: product},
                fields: { error_message: error_message},
        }
        ]).catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`)
        })
}


function storeRate(exchange, crypto_currency, fiat_currency, rate)
{
	cryptocurrencies_db.writePoints([
        {
        	measurement: 'cryptocurrencies_rates',
	        tags: { exchange: exchange, crypto_currency: crypto_currency, fiat_currency: fiat_currency },
	        fields: { rate_float: rate },
        }
        ]).catch(err => {
        	console.error(`Error saving data to InfluxDB! ${err.stack}`)
        })
}

app.get('/', function (req, result) {
	// Coinbase prices
	getSpotPriceWrapper('coinbase', 'BTC-USD');
	getSpotPriceWrapper('coinbase', 'BTC-EUR');
	getSpotPriceWrapper('coinbase', 'ETH-USD');
	getSpotPriceWrapper('coinbase', 'ETH-EUR');
	
	result.sendStatus(200);
})

app.listen(8780, function () {
	console.log('Listening on 8780')
})
