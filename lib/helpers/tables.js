'use strict';

function format_table_name(modelName) {
  return modelName.replace(/([A-Z])/g, c => '_' + c.toLowerCase())
    .replace(/^_*/g, '');
}

exports.format_table_name = format_table_name;
