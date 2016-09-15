'use strict';

// var mysql      = require('mysql');
// var connection = mysql.createConnection({
//   host     : 'example.org',
//   user     : 'souschef',
//   password : 'S3rv3r22!'
// });
//
// connection.connect(function(err) {
//   if (err) {
//     console.error('error connecting: ' + err.stack);
//     return;
//   }
//
//   console.log('connected as id ' + connection.threadId);
// });

var Recipe = require('./app/models/recipe'),
    Table = require('./lib/table');

console.log(JSON.stringify(Recipe.fields, null, 2));
console.log(JSON.stringify(Recipe.properties, null, 2));

console.log(new Table(Recipe).get_create_table_statement());
