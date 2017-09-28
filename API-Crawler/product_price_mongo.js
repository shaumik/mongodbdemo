var DB_NAME = 'product_price';
var COLLECTION_NAME = 'product_price';

var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var db;

connect();

module.exports = {
  connect : connect,
  insert : insert,
  close : close
};

/***** FUNCTIONS *****/

/** This creates a connection to the database.
**/
function connect(){
  mongoClient.connect('mongodb://localhost:27017/' + DB_NAME, function(err, dbConn) {
    if (err)
      throw err; // TODO send email to engineering.

    db = dbConn;
  });
};

/** This inserts data into collection.
    @param object The object to insert
**/
function insert(object){
  db.collection(COLLECTION_NAME).insert(object, function(err, doc){
    if (err) 
      throw err; // TODO send email to engineering.
    
    console.log('insertion');
  });
};

/** Close the db, or the script won't exit. 
**/
function close(){
  db.close();
};