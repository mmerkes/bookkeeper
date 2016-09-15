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

  // {
  //   "fields": [
  //     {
  //       "Field": "id",
  //       "Type": "int(11)",
  //       "Collation": null,
  //       "Null": "NO",
  //       "Key": "PRI",
  //       "Default": null,
  //       "Extra": "auto_increment",
  //       "Privileges": "select,insert,update,references",
  //       "Comment": "foobar"
  //     },
  //     {
  //       "Field": "other_id",
  //       "Type": "int(11)",
  //       "Collation": null,
  //       "Null": "YES",
  //       "Key": "MUL",
  //       "Default": null,
  //       "Extra": "",
  //       "Privileges": "select,insert,update,references",
  //       "Comment": ""
  //     },
  //     {
  //       "Field": "foo",
  //       "Type": "varchar(40)",
  //       "Collation": "latin1_swedish_ci",
  //       "Null": "NO",
  //       "Key": "",
  //       "Default": "foo",
  //       "Extra": "",
  //       "Privileges": "select,insert,update,references",
  //       "Comment": ""
  //     },
  //     {
  //       "Field": "bar",
  //       "Type": "varchar(20)",
  //       "Collation": "latin1_swedish_ci",
  //       "Null": "YES",
  //       "Key": "UNI",
  //       "Default": null,
  //       "Extra": "",
  //       "Privileges": "select,insert,update,references",
  //       "Comment": ""
  //     }
  //   ],
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
        obj.default = field.default;
      }

      if (field.Key === 'UNI') {
        obj.unique = true;
      }

      if (field.comment) {
        obj.comment = field.comment;
      }

      map[field.Field] = obj;
    }, this._fields);

    return this;
  }

  // "keys": [
  //     {
  //       "COLUMN_NAME": "other_id",
  //       "REFERENCED_TABLE_NAME": "other",
  //       "REFERENCED_COLUMN_NAME": "id",
  //       "CONSTRAINT_NAME": "example_ibfk_1",
  //       "UPDATE_RULE": "CASCADE",
  //       "DELETE_RULE": "NO ACTION"
  //     },
  //     {
  //       "COLUMN_NAME": "other_id2",
  //       "REFERENCED_TABLE_NAME": "other",
  //       "REFERENCED_COLUMN_NAME": "id2",
  //       "CONSTRAINT_NAME": "example_ibfk_1",
  //       "UPDATE_RULE": "CASCADE",
  //       "DELETE_RULE": "NO ACTION"
  //     },
  //     {
  //       "COLUMN_NAME": "id",
  //       "REFERENCED_TABLE_NAME": null,
  //       "REFERENCED_COLUMN_NAME": null,
  //       "CONSTRAINT_NAME": "PRIMARY",
  //       "UPDATE_RULE": null,
  //       "DELETE_RULE": null
  //     },
  //     {
  //       "COLUMN_NAME": "other_id",
  //       "REFERENCED_TABLE_NAME": null,
  //       "REFERENCED_COLUMN_NAME": null,
  //       "CONSTRAINT_NAME": "PRIMARY",
  //       "UPDATE_RULE": null,
  //       "DELETE_RULE": null
  //     },
  //     {
  //       "COLUMN_NAME": "bar",
  //       "REFERENCED_TABLE_NAME": null,
  //       "REFERENCED_COLUMN_NAME": null,
  //       "CONSTRAINT_NAME": "bar",
  //       "UPDATE_RULE": null,
  //       "DELETE_RULE": null
  //     }
  //   ]
  add_key_information(keys) {
    if (!this._properties.foreign_keys) {
      this._properties.foreign_keys = {};
    }

    if (!this._actual) {
      this._actual = [];
    }

    var fk_props = this._properties.foreign_keys,
        primary_key = this._actual;

    var map = keys.reduce((map, key) => {
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

      return map;
    }, {
      primary_key: [],
      foreign_keys: {}
    });

    primary_key.push.apply(primary_key, map.primary_key);

    Object.keys(map.foreign_keys).forEach(foreign_key => {
      fk_props.push(foreign_key);
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

    Object.keys(model._fields).forEach(field => {
      if (!fields[field]) {
        diff.fields.push({
          action: ADD,
          definition: model._fields[field],
          name: field
        });
      } else if (Object.keys(fields[field]).length !==
                Object.keys(model._fields[field]).length ||
                !_.isEqual(fields[field], model._fields[field])) {
        diff.fields.push({
          action: UPDATE,
          definition: model._fields,
          name: field
        });
      }
    });

    Object.keys(fields).forEach(field => {
      if (!model._fields) {
        diff.fields.push({
          action: DELETE,
          name: field
        });
      }
    });

    diff.properties.push.apply(diff.properties,
      this.diff_primary_keys(model._properties.primary_key, properties.primary_key));
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
