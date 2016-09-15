'use strict';

const NOT_FOUND = -1;

const MAX_VARCHAR = 65535;

const DEFAULT_INT = 'INT';
const INT_BYTES_TO_NAME = {
  '-1': DEFAULT_INT,
  '1': 'TINYINT',
  '2': 'SMALLINT',
  '3': 'MEDIUMINT',
  '4': 'INT',
  '8': 'BIGINT'
};

function get_type_size(type) {
  return type.split('-')[1] || NOT_FOUND;
}

// TODO:
// 1. Add all numeric data types
// 2. Add all string data types
// 3. Add all date/time data types
// 4. Add all large object data types
// NOTE: When you add a new data type to data_type_to_sql, also add it to sql_to_data_type
function data_type_to_sql(type) {
  var size = get_type_size(type);

  if (type.startsWith('varchar')) {
    if (!Number.isInteger(+size) || size > MAX_VARCHAR || size < 1) {
      throw new Error(`VARCHAR size must be between 1 and ${MAX_VARCHAR}. Actual: ${type}`);
    }

    return `VARCHAR(${size})`;
  } else if (type.startsWith('int')) {
    if (INT_BYTES_TO_NAME[size]) {
      return INT_BYTES_TO_NAME[size];
    } else if (/u[1-8]{0,1}$/.test(size) && INT_BYTES_TO_NAME[size.charAt(1)]) {
      return INT_BYTES_TO_NAME[size.charAt(1)] + ' UNSIGNED';
    }
    throw new Error(`Integer must be a valid integer size in bytes: 1, 2, 3, 4, or 8. Actual: ${type}`);
  } else {
    throw new Error(`Data type is invalid or not yet supported. Actual: ${type}`);
  }
}

exports.data_type_to_sql = data_type_to_sql;

function is_string_type(type) {
  return type.startsWith('varchar');
}

exports.is_string_type = is_string_type;

var sql_types_map = {
  'tinyint(4)': 'int-1',
  'smallint(6)': 'int-2',
  'mediumint(9)': 'int-3',
  'int(11)': 'int-4',
  'bigint(20)': 'int-8'
};

/*
 * Reverse translation from SQL DESCRIBE TABLE query type to bookkeeper type.
 */
function sql_to_data_type(type) {
  if (sql_types_map[type]) {
    return sql_types_map[type];
  }

  if (/^varchar\([0-9]{1,}\)$/.test(type)) {
    return 'varchar-' + type.substring(type.indexOf('(') + 1, type.indexOf(')'));
  }

  throw new Error(`Data type is invalid or not yet supported. Actual: ${type}`);
}

exports.sql_to_data_type = sql_to_data_type;
