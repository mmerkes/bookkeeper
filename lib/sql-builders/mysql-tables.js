'use strict';

const AUTO_INCREMENT = 'AUTO_INCREMENT';
const COMMENT = 'COMMENT';
const DEFAULT = 'DEFAULT';
const NOT_NULL = 'NOT NULL';
const UNIQUE = 'UNIQUE';

var typeHelper = require('./mysql-data-types'),
    format_table_name = require('../helpers/tables').format_table_name,
    foreign_key_builder = require('./mysql-keys'),
    data_types = require('./mysql-data-types');

function get_field_definition(name, properties) {
  var string_builder = [name];

  string_builder.push(typeHelper.data_type_to_sql(properties.type));

  if (properties.auto_increment) {
    string_builder.push(AUTO_INCREMENT);
  }

  if (properties.comment) {
    string_builder.push(COMMENT);
    string_builder.push(`'${properties.comment}'`);
  }

  // Only set default if not set to auto_increment or unique since it wouldn't work
  if (properties.default && !properties.auto_increment && !properties.unique) {
    string_builder.push(DEFAULT);
    if (data_types.is_string_type(properties.type)) {
      string_builder.push(`"${properties.default}"`);
    } else {
      string_builder.push(properties.default);
    }
  }

  if (properties.not_null) {
    string_builder.push(NOT_NULL);
  }

  if (properties.unique) {
    string_builder.push(UNIQUE);
  }

  return string_builder.join(' ');
}

exports.get_field_definition = get_field_definition;

function get_field_definitions(fields, properties) {
  var s = Object.keys(fields).reduce((pre, cur, index, keys) => {
    pre += get_field_definition(cur, fields[cur]);

    if (index != keys.length - 1) {
      pre += ', ';
    }

    return pre;
  }, '');

  if (properties.primary_key && properties.primary_key.length) {
    s += `, PRIMARY KEY (${properties.primary_key.join(', ')})`;
  }

  if (properties.foreign_keys) {
    s += properties.foreign_keys.reduce((pre, foreign_key) => {
      return pre + ', ' + foreign_key_builder.foreign_key_to_sql(foreign_key);
    }, '');
  }

  return s;
}

exports.create_table = function create_table(name, fields, properties) {
  return `CREATE TABLE ${name} (${get_field_definitions(fields, properties)})`;
};

exports.show_full_columns = function show_full_columns(table_name) {
  return `SHOW FULL COLUMNS FROM ${table_name}`;
};

exports.get_key_information = function get_key_information(table) {
  return 'SELECT' +
    '          U.COLUMN_NAME,' +
    '          U.REFERENCED_TABLE_NAME,' +
    '          U.REFERENCED_COLUMN_NAME,' +
    '          U.CONSTRAINT_NAME,' +
    '          C.UPDATE_RULE,' +
    '          C.DELETE_RULE' +
    '      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE U' +
    '      LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS C' +
    '          ON U.CONSTRAINT_NAME = C.CONSTRAINT_NAME' +
    '      WHERE' +
    `          U.TABLE_NAME = "${table}"`;
};
