'use strict';

/*
 * Features:
 * 1. deserialize and serialize properties for fields
 * 2. db interaction methods
 * 3. validation
 * 4. Add "stable" property, which will throw on model changes (maybe just delete)
 * 5. debug mode - print sql statements before running
 * 6. Adds indexes
 */

 var data_type_to_sql = require('./sql-builders/mysql-data-types').data_type_to_sql,
      foreign_key_helper = require('./helpers/foreign-keys');

class Model {
  constructor(fields, properties) {
    // Will throw if model invalid
    this._validate_model(fields, properties);
    this._fields = fields;
    this._properties = properties;
  }

  _validate_model(fields, properties) {
    // Validate that each field has a valid type
    Object.keys(fields).forEach(field => {
      if (!fields[field].type) {
        throw new Error(`Field ${field} must define a valid type.`);
      }
      // Will throw if data type is invalid.
      data_type_to_sql(fields[field].type);
    });

    if (properties.primary_key) {
      // Validate that primary_key fields exist
      properties.primary_key.forEach(key => {
        if (!fields[key]) {
          throw new Error(`primary_key ${key} must be defined in fields object`);
        }
      });
    }

    if (properties.foreign_keys) {
      // Validate that foreign_keys fields exist and config is valid
      properties.foreign_keys.forEach(foreign_key => {
        // Will throw if invalid
        foreign_key_helper.validate_foreign_key(fields, foreign_key);
      });
    }

    // Validate that the name of the model is included
    if (!properties.name) {
      throw new Error('name is a required field for Model properties');
    }
  }
}

module.exports = Model;
