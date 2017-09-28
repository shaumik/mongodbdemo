'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
/**
 * Thing Schema
 */
var ProductSchema = new Schema({
  name: String,
  info: String  
});

mongoose.model('Product', ProductSchema);