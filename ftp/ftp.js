var JSFtp = require("jsftp");
var nconf = require("nconf").file('../ftp/config/config_ftp.json').env();
var exec = require('child_process').exec;

console.log(nconf.get("user"));

//var filepath = "";
//var remotepath = "/NortonPricing/"


var ftp = new JSFtp({
  user: nconf.get("user"),
  pass: nconf.get("pass"),
  host: nconf.get("host"),
  port: 21
});


//ftps the CSV from /temp
var FTP_push = function(){
	Push_data();
	var now = new Date();
	var formattedDate = (now.getMonth()+1) + '-' + now.getDate() + '-' + now.getFullYear();
	ftp.put('./tmp/product_price.csv', nconf.get("remotepath")+"nortonprice-"+formattedDate+".csv", function(hadError) {
		if (!hadError){

			console.log("File transferred successfully!");
		}
		else{
			console.log(hadError);
					}
	});	
};


var Push_data = function(){
	var now = new Date();
	

	var month = now.getMonth()+1;

	if(now.getMonth()<=9){
		month = "0"+ month;
	}

	var formattedDate = now.getFullYear() + '-' + month + '-' + now.getDate();
	// console.log("Date: " + formattedDate);
	var mongoexportFormatted = "mongoexport --csv -o ./tmp/product_price.csv -d product_price -c product_price --query " + "\"{'date':'" + formattedDate + "'}\"" + " -f date,vendor,retailer,product,upc,full_url,parent_url,is_error,price";
	// console.log(mongoexportFormatted);
	// exec('mongoexport --csv -o ./tmp/product_price.csv -d product_price -c product_price --query {"date":"2014-08-21"} -f date,vendor,retailer,product,upc,full_url,parent_url,is_error,price',function(error,stdout,stderr){
	   exec(mongoexportFormatted, function(error,stdout,stderr){
	
		if(!error){
			console.log("Formatted to CSV correctly hopefully");
		}
	});

}


// FTP_push();

module.exports.ftp_push = FTP_push;

console.log('gg');
