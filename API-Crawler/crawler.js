var http = require('http');
var jsdom = require('jsdom');
var $ = require('jquery')(jsdom.jsdom().createWindow());
var db = require('./product_price_mongo');

var OPTIONS = ['productSelector', 'vendorSelector', 'retailer', 'productNameSelector',
  'upcSelector', 'fullUrlSelector', 'parentUrl', 'priceSelector'];

var TOKEN_SPLITTER = /[^A-z0-9]+/;
var UNCLEAN = /[^A-z0-9]+/g;

var crawlerPrototype = {
  getURL : getURL,
  config : config,
  parseResponse : parseResponse,
  parseProduct : parseProduct, // TODO: does this need refactoring / renaming?
  crawl : crawl,
  priceFormatter: defaultFormatter,
  filterProducts: filterProducts,
  cleanQuery: cleanQuery,
  tokenize: tokenize
};

module.exports = {makeCrawler : makeCrawler};

/***** FUNCTIONS *****/

/** This function returns a basic crawler object.
    @param configs an object with the configurations to config. Please see the config function for
      the fields needed.
    @return the basic crawler object.
**/
function makeCrawler(configs){
  var crawler = Object.create(crawlerPrototype);
  crawler.config(configs);
  return crawler;
};

/** This function generates the URL for the crawler to visit. 
    It is abstract, and thus must be implemented in the crawler that extends this prototype.
    @param query What to query
    @return the url to get the data
**/
function getURL(query){
  throw 'getURL not implemented!';
};

/** This function configures the crawler.
    @param configs The configs to pass to crawler. See OPTIONS for valid configs.
    @return the object that called the method (so it can be chained).
**/
function config(configs){
  var key;

  if (typeof configs === 'object'){
    for (i in OPTIONS)
      this[OPTIONS[i]] = configs[OPTIONS[i]] || this[OPTIONS[i]];
  }

  return this;
};

/** This function parses the html response and returns an array of objects to be inserted into db.
    @param html The html to parse
    @return A collection of parsed products from the html.

    Note: the following configs should be set in the config method.
      productSelector: the selector that will select all of the data for the product and just that product
      vendorSelector: the selector that will get the vendor of the product
      retailer: the string that represents the retailer (e.g. 'Amazon')
      productNameSelector: the selector that will get the product name
      upcSelector: the selector that will get the upc
      fullUrlSelector: the selector that will get the full url
      parentUrl: the string that will represent the parent url (e.g 'www.amazon.com')
      priceSelector: the selector that will get the price
**/
function parseResponse(html){
  var products = [];
  var that = this;

  $(html).find(this.productSelector).each(function(i, product){
    var $product = $(product);

    var data = that.parseProduct($product);

    products.push(data);
  });

  return products;
};

/** Parses a product and returns a data object to be inserted into db.
    @param $product A jQuery object that represents a product from the html response
    @return An object to be inserted in the db containing the parsed data from $product.
**/
function parseProduct($product){

  var data = {};

  data.date = dateFormatter(new Date());
  data.vendor = $product.find(this.vendorSelector).text();
  data.retailer = this.retailer;
  data.product = $product.find(this.productNameSelector).text();
  data.upc = $product.find(this.upcSelector).text();
  data.full_url = $product.find(this.fullUrlSelector).text();
  data.parent_url = this.parentUrl;
  data.is_error = 0;
  data.price = this.priceFormatter($product.find(this.priceSelector).text());

  return data;

}

/** This function crawls for product and inserts it into the db.
    @param productQuery The product you want to query.
**/
function crawl(productQuery){
  var html = '';
  var url = this.getUrl(productQuery);
  console.log(url);
  var that = this;

  http.get(url, function (response){

    response.on('data', function (data) {
      html += data.toString();
    });

    response.on('end', function(){
      var products = that.parseResponse(html); // can't use 'this' b/c it refers to response
      console.log(products.length); 

      products = that.filterProducts(products, productQuery);
      console.log(products.length);

      // if no products parsed, insert error
      if (!products.length){
        var product = {};
        product.date = dateFormatter(new Date());
        product.retailer = that.retailer;
        product.product = productQuery;
        product.parent_url = that.parentUrl;
        product.is_error = 1;
        products.push(product);
      }

      console.log('*****' + productQuery + '*****');
      console.log(products);
      db.insert(products);

    });

  });
};

/** Sometimes, fields need a little formatting. E.g. Amazon puts its price in cents; BestBuy
    in dollars. Each field shall have its own formatter. This is the default implementation for
    each formatter: do nothing.
    @param text The text to format.
    @return text formatted.
**/
function defaultFormatter(text){
  return text;
};

/** Format the date the way Ken wants it.
    @param date the date to format
    @return the date in correct string format
**/
function dateFormatter(date){
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  return year + '-' + ('0' + month).slice(-2) + '-' + day; // the '0' and the slicing is for left padding
};

/** Filters less relevant search materials.
    @param products An array of product objects to filter.
    @param query The query to use to filter.
    @param attributes A list of attributes to check the query against. By defaut, vendor and product are used.
    	The more attributes used, the more likely a product is to match.
    @return a new array with the relevant results
**/
function filterProducts(products, query, attributes){

	attributes = attributes || ['vendor', 'product'];

  var i, j, checkThis, tokens = this.tokenize(query);
  var shouldInclude = true;
  var filtered = [];

  // Filter.
  for (i in products){
    
    checkThis = '';
    for (j in attributes){
    	checkThis += products[i][attributes[j]].toLowerCase();
    }

    shouldInclude = true;

    // Check string for tokens.
    for (j in tokens){
      if (checkThis.search(tokens[j]) < 0) // can't find token
        shouldInclude = false;
    }

    if (shouldInclude)
      filtered.push(products[i]);
  }

  return filtered;
};

/** Replaces all non-alphanumberic sequences with a space and lowercases the string. 
    @param query The query to clean.
    @return a clean query string
**/
function cleanQuery(query){
  return query.toLowerCase().replace(UNCLEAN, ' ').trim();
};


/** Tokenizes a query by splitting the string into lowercase tokens. Non-alphanumberic characters are removed.
    @param query The query to tokenize
    @return a clean query string
**/
function tokenize(query){
  return query.toLowerCase().split(TOKEN_SPLITTER);
};