/** This crawler is used to search the WalMart API.
    Info on the API can be found at https://developer.walmartlabs.com/docs/read/Search_API
**/

var crawlerModule = require('./crawler');

var KEY = 'aqdh6bce77dkt5m8sypuk9rm';

var CATEGORY_ID = '3944'; // 3944 is electronics
var CONFIGS = {
  productSelector: 'items > item',
  vendorSelector: 'brandName',
  retailer: 'Walmart',
  productNameSelector: '> name',
  upcSelector: '> upc',
  fullUrlSelector: '> productUrl',
  parentUrl: 'www.walmart.com',
  priceSelector: '> salePrice'
};

var crawler = crawlerModule.makeCrawler(CONFIGS);

crawler.getUrl = function(query){

  query = this.cleanQuery(query);

  var urlstring = 'http://api.walmartlabs.com/v1/search?apiKey=' + KEY + '&query=' + encodeURIComponent(query);
  urlstring += '&categoryId=' + CATEGORY_ID + '&format=xml&responseGroup=full';

  // TODO? can filter by categoryId

  return urlstring;
}

module.exports = crawler;