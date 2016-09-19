'use strict';

var async = require('async'),
    Model = require('./model'),
    logger = require('./helpers/logger'),
    typeHelper = require('./sql-builders/mysql-data-types'),
    format_table_name = require('./helpers/tables').format_table_name;

const ADD = 'add';
const DELETE = 'delete';
const UPDATE = 'update';

const NO_TABLE_ERROR = 'ER_NO_SUCH_TABLE';

/*
 * Features:
 * 1. debug mode - print sql statements before running
 * 2. validate model
 */
class Table {
  constructor(model, connection) {
    if (!(model instanceof Model)) {
      throw new Error("Table constructor must be passed an instance of Bookkeeper.Model");
    }

    if (!connection || connection.constructor.toString().indexOf('Connection') === -1) {
      throw new Error('Table constructor must be passed an instance of a connection');
    }

    this.model = model;
    this.connection = connection;
    // When supporting more database types, this can be dynamically set.
    this.sqlBuilder = require('./sql-builders/mysql-tables.js');
  }

  get_table_name() {
    return format_table_name(this.model._properties.name);
  }

  get_create_table_statement() {
    return this.sqlBuilder.create_table(this.get_table_name(), this.model._fields,
      this.model._properties);
  }

  update_table(callback) {
    /*
      1. Check if table exists
      2. If it doesn't exist, create it
      3. If it does exist, check to see if its state matches the expected state
      4. If it doesn't match the expected state, update it
    */
    this.get_table_information((err, results) => {
      if (err) {
        if (err.code === NO_TABLE_ERROR) {
          return this.create_table(callback);
        } else {
          throw err;
        }
      }

      // Get table diff
      // Update table
      // throw new Error('NOT YET IMPLEMENTED');
      return callback(null, results);
    });
  }

  get_table_information(callback) {
    var self = this;
    async.parallel({
      fields: callback => {
        return self.get_field_information(callback);
      },
      keys: callback => {
        return self.get_key_information(callback);
      }
    }, callback);
  }

  get_field_information(callback) {
    var query = this.sqlBuilder.show_full_columns(this.get_table_name());
    logger.debug(query);

    this.connection.query(query, (err, fields) => {
      return callback(err, fields);
    });
  }

  get_key_information(callback) {
    var query = this.sqlBuilder.get_key_information(this.get_table_name());
    logger.debug(query);

    this.connection.query(query, (err, keys) => {
      return callback(err, keys);
    });
  }

  create_table(callback) {
    var query = this.get_create_table_statement();
    logger.debug(query);

    this.connection.query(query, callback);
  }
}

module.exports = Table;
