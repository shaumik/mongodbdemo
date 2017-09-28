var crypto = require('crypto');
var crawlerModule = require('./crawler');

var AWS_ACCESS_KEY_ID = 'AKIAI6QNUH4OQCMYV7XQ';
var AWS_SECRET_ACCESS_KEY = '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';
var RETAILER = 'Amazon';
var PARENT_URL = 'www.amazon.com';

var CONFIGS = {
  productSelector: 'Items > Item',
  vendorSelector: '> ItemAttributes > Brand',
  retailer: 'Amazon',
  productNameSelector: '> ItemAttributes > Title',
  upcSelector: '> ItemAttributes > UPC',
  fullUrlSelector: '> DetailPageURL',
  parentUrl: 'www.amazon.com',
  priceSelector: '> Offers > Offer > OfferListing > Price > Amount'
};

var crawler = crawlerModule.makeCrawler(CONFIGS);

// Overload methods
crawler.getUrl = function(query){

  query = this.cleanQuery(query); // characters like ! are not properly encoded

  var action = 'GET';
  var server = "webservices.amazon.com";
  var path = "/onca/xml";
  var hmac = crypto.createHmac('sha256', AWS_SECRET_ACCESS_KEY);

  var params = {'ResponseGroup':'Large',
    'AssociateTag':'979751609',
    'Operation':'ItemSearch',
    'SearchIndex':'Software', // TODO: also search MobileApps index
    'Keywords': query,
    'Version' : '2013-08-01',
    'AWSAccessKeyId' : AWS_ACCESS_KEY_ID,
    'Service' : 'AWSECommerceService',
    'Timestamp' : new Date().toISOString().replace(/\.\d+/, '')
  };

  // Sort params.
  var paramstring = '';
  Object.keys(params).sort().forEach(function(key){
    paramstring += (key + '=' + encodeURIComponent(params[key]) + '&');
  });
  paramstring = paramstring.slice(0, -1);

  // Make url.
  var urlstring = 'http://' + server + path + '?' + paramstring;
  hmac.update(action + '\n' + server + '\n' + path + '\n' + paramstring);
  urlstring = urlstring + "&Signature=" + encodeURIComponent(hmac.digest('base64'));

  return urlstring;

};

/** Converts price from cents into dollars
    @param text the text to convert
    @return the text in dollars
**/
crawler.priceFormatter = function(text){
  return parseInt(text) ? (parseInt(text) / 100).toFixed(2) : text;
};

module.exports = crawler;