'use strict';

var data_types = require('../sql-builders/mysql-data-types'),
    format_table_name = require('../helpers/tables').format_table_name,
    _ = require('underscore');

const ADD = 'add',
      UPDATE = 'update',
      DELETE = 'delete',
      PRIMARY_KEY = 'primary_key',
      FOREIGN_KEY = 'foreign_key';

class TableDiffBuilder {
  constructor(model) {
    this._model = model;
    this._fields = {};
    this._properties = {};
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
    var model = this._model,
        fields = this._fields,
        properties = this._properties;

    var diff = {
      fields: [],
      properties: []
    };

    diff.fields.push.apply(diff.fields,
      this.diff_fields(this._model._fields, this._fields));

    diff.properties.push.apply(diff.properties,
      this.diff_primary_keys(this._model._properties.primary_key, this._properties.primary_key));

    return diff;
  }

  diff_fields(model, actual) {
    var diff = [];

    Object.keys(model).forEach(field => {
      if (!actual[field]) {
        diff.push({
          action: ADD,
          definition: model[field],
          name: field
        });
      } else if (Object.keys(actual[field]).length !==
                Object.keys(model[field]).length ||
                !_.isEqual(actual[field], model[field])) {
        diff.push({
          action: UPDATE,
          definition: model[field],
          name: field
        });
      }
    });

    Object.keys(actual).forEach(field => {
      if (!model[field]) {
        diff.push({
          action: DELETE,
          name: field
        });
      }
    });

    return diff;
  }

  diff_primary_keys(model, actual) {
    var diff = [];

    if (model && model.length) {
      if (!actual || !actual.length) {
        diff.push({
          action: ADD,
          type: PRIMARY_KEY,
          definition: model
        });
      } else if (actual.length !== model.length || _.difference(actual, model).length) {
        diff.push({
          action: UPDATE,
          type: PRIMARY_KEY,
          definition: model
        });
      }
    } else if (actual && actual.length) {
      diff.push({
        action: DELETE,
        type: PRIMARY_KEY
      });
    }

    return diff;
  }
}

module.exports = TableDiffBuilder;
