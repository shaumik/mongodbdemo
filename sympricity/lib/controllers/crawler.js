'use strict';

var api = require('./api'),
	CronJob = require('cron').CronJob,
	mongoose = require('mongoose'),
	Product= mongoose.model('Product'),
	amazon_crawler = require('../../../API-Crawler/amazon_api_crawler'),
	walmart_crawler = require('../../../API-Crawler/walmart_api_crawler'),
	bestbuy_crawler = require('../../../API-Crawler/bestbuy_api_crawler'),
	ftp = require('../../../ftp/ftp.js');

// amazon_crawler.crawl('McAfee');

// console.log(products);
var prods = [];
var cron = new CronJob('00 0-59 * * * *', function(){
	
	getAllProducts(function(err, products){
		// console.log(products);
		 prods = products;
	});
	// console.log(getAllProducts());
	console.log(prods);
	for( var i in prods){
		console.log('Product name'+prods[i]);
		amazon_crawler.crawl(prods[i]);
		walmart_crawler.crawl(prods[i]);
		bestbuy_crawler.crawl(prods[i]);


	}
	
	ftp.ftp_push();
	console.log('You will see this message every 1 second');
}, null, true);


var prods1 = [];

function getAllProducts(callback){

Product.find(function(err, products){

	if(!err){
		// console.log('inside db call'+products);
		prods1 = [];	
		for (var i in products){
			if(products[i].name !== undefined)
				prods1.push(products[i].name);
		}
		// console.log(prods);
		callback(null, prods1);
	}
	else {
		// console.log(prods);
		callback(err)
		} 
});


}





