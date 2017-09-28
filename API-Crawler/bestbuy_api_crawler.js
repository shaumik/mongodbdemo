var crawlerModule = require('./crawler');

var KEY = 'cyj6cc2dzpwzjum85jsx97jr';
var CONFIGS = {
  productSelector: 'product',
  vendorSelector: '> manufacturer',
  retailer: 'BestBuy',
  productNameSelector: '> name',
  upcSelector: '> upc',
  fullUrlSelector: '> url',
  parentUrl: 'www.bestbuy.com',
  priceSelector: '> salePrice'
};

var crawler = crawlerModule.makeCrawler(CONFIGS);

crawler.getUrl = function(query){

  // Bestbuy api doesn't handle spaces correctly.
  var searchString = '';
  var i, tokens = this.tokenize(query);
  for (i in tokens){
    searchString += ('search=' + tokens[i] + '&');
  }
  searchString = searchString.substring(0, searchString.length - 1);


  var urlstring = 'http://api.remix.bestbuy.com/v1/products(' + searchString;
  urlstring += '&categoryPath.category.name=Software*)?apiKey=' + KEY;

  return urlstring;
};

module.exports = crawler;