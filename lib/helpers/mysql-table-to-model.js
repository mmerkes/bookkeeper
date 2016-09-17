'use strict';

var data_types = require('../sql-builders/mysql-data-types'),
    Model = require('../model'),
    _ = require('underscore');

class MySQLTableToModel {
  constructor(model_name) {
    this._fields = {};
    this._properties = {
      name: model_name
    };
  }

  add_fields(fields) {
    fields.reduce((map, field) => {
      var obj = {};
      obj.type = data_types.sql_to_data_type(field.Type);

      if (field.Null === 'NO') {
        obj.not_null = true;
      }

      if (field.Extra.indexOf('auto_increment') !== -1) {
        obj.auto_increment = true;
      }

      if (field.Default) {
        obj.default = field.Default;
      }

      if (field.Key === 'UNI') {
        obj.unique = true;
      }

      if (field.Comment) {
        obj.comment = field.Comment;
      }

      map[field.Field] = obj;

      return map;
    }, this._fields);

    return this;
  }

  add_keys(keys) {
    if (!this._properties.foreign_keys) {
      this._properties.foreign_keys = [];
    }

    if (!this._properties.primary_key) {
      this._properties.primary_key = [];
    }

    var foreign_keys = this._properties.foreign_keys;

    var map = {
      primary_key: [],
      foreign_keys: {}
    };

    // Add existing foreign_key information
    foreign_keys.forEach(key => {
      map.foreign_keys[key.model] = key;
    });

    keys.forEach(key => {
      if (key.CONSTRAINT_NAME === 'PRIMARY') {
        map.primary_key.push(key.COLUMN_NAME);
      } else if (key.REFERENCED_COLUMN_NAME) {
        var obj = map.foreign_keys[key.REFERENCED_TABLE_NAME] || {
          model: key.REFERENCED_TABLE_NAME,
          mappings: {}
        };

        obj.mappings[key.COLUMN_NAME] = key.REFERENCED_COLUMN_NAME;
        obj.constraint_name = key.CONSTRAINT_NAME;
        obj.on_update = key.UPDATE_RULE;
        obj.on_delete = key.DELETE_RULE;

        map.foreign_keys[key.REFERENCED_TABLE_NAME] = obj;
      }
      // Otherwise, it is likely a unique key or unhandled type
    });

    this._properties.primary_key = _.uniq(this._properties.primary_key.concat(map.primary_key));

    this._properties.foreign_keys = Object.keys(map.foreign_keys).map(model => {
      var key = map.foreign_keys[model];
      key.model = model;

      return key;
    });

    return this;
  }

  build() {
    return new Model(this._fields, this._properties);
  }
}

module.exports = MySQLTableToModel;
