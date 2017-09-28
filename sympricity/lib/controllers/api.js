'use strict';

var mongoose = require('mongoose'),
    Product= mongoose.model('Product'),
    Cron = require('./crawler');

/**
 * Get awesome things
 */
exports.getProducts = function(req, res) {
	// console.log(req);
  // console.log("********************About to start Cron ***********************");
  //Cron.cron();

  return Product.find(function (err, products) {
    if (!err) {
    	// console.log(req);
    	// console.log('******Products*******');
    	// console.log(products);
    	// console.log('******Products-End*******');
      return res.json(200, products);
    } else {
    	console.log('******Error*******');
      return res.send(404, err);
    }
  });
};

exports.addProduct = function(req, res) {
	// console.log(req.body);
	var newProd = new Product();
	newProd.name = req.body.name;
  return newProd.save(function (err, product) {
    if (!err) {
    	console.log("From MOngoose" + product);
      return res.json(201, product);
    } else {
      return res.send(err);
    }
  });
};