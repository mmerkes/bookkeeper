'use strict';

var tables_helper = require('../helpers/tables');

const CONSTRAINT = 'CONSTRAINT';

function foreign_key_to_sql(foreign_key) {
  var string_builder = [];

  if (foreign_key.constraint) {
    string_builder.push(CONSTRAINT);
    string_builder.push(foreign_key.constraint);
  }

  var self_keys = [],
      ref_keys = [];

  Object.keys(foreign_key.mappings).forEach((key) => {
    self_keys.push(key);
    ref_keys.push(foreign_key.mappings[key]);
  });

  string_builder.push(`FOREIGN KEY (${self_keys.join(', ')})`);
  string_builder.push(`REFERENCES ${tables_helper.format_table_name(foreign_key.model)}`);
  string_builder.push(`(${ref_keys.join(', ')})`);

  if (foreign_key.on_delete) {
    string_builder.push('ON DELETE');
    string_builder.push(foreign_key.on_delete.toUpperCase());
  }

  if (foreign_key.on_update) {
    string_builder.push('ON UPDATE');
    string_builder.push(foreign_key.on_update.toUpperCase());
  }

  return string_builder.join(' ');
}

exports.foreign_key_to_sql = foreign_key_to_sql;
