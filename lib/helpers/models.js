'use strict';

var format_table_name = require('./tables').format_table_name,
    _ = require('underscore');

const ADD = 'add',
      UPDATE = 'update',
      DELETE = 'delete',
      PRIMARY_KEY = 'primary_key',
      FOREIGN_KEY = 'foreign_key';

function diff_models(model, actual) {
  var fields = actual._fields,
      properties = actual._properties;

  var diff = {
    fields: [],
    properties: []
  };

  diff.fields.push.apply(diff.fields,
    diff_fields(model._fields, actual._fields));

  diff.properties.push.apply(diff.properties,
    diff_primary_keys(model._properties.primary_key, actual._properties.primary_key));

  diff.properties.push.apply(diff.properties,
    diff_foreign_keys(model._properties.foreign_keys, actual._properties.foreign_keys));

  return diff;
}

exports.diff_models = diff_models;

function diff_fields(model, actual) {
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

exports.diff_fields = diff_fields;

function diff_primary_keys(model, actual) {
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

exports.diff_primary_keys = diff_primary_keys;

function diff_foreign_keys(model, actual) {
  var diff = [];

  var model_hash = {},
      actual_hash = {};

  model.forEach(key => {
    model_hash[key.model.toLowerCase()] = key;
  });

  actual.forEach(key => {
    actual_hash[key.model.toLowerCase()] = key;
  });

  Object.keys(model_hash).forEach(key => {
    if (!actual_hash[key]) {
      diff.push({
        action: ADD,
        type: FOREIGN_KEY,
        definition: model_hash[key]
      });
    } else {
      var m_key = model_hash[key],
          a_key = actual_hash[key];

      if (m_key.constraint_name &&
        m_key.constraint_name.toLowerCase() !== a_key.constraint_name.toLowerCase()) {
        // We must delete and re-add because it's the only way to rename a foreign_key
        diff.push({
          action: DELETE,
          type: FOREIGN_KEY,
          constraint_name: a_key.constraint_name
        });
        diff.push({
          action: ADD,
          type: FOREIGN_KEY,
          definition: m_key
        });
      } else if (!_.isEqual(m_key.mappings, a_key.mappings) ||
        m_key.on_delete && m_key.on_delete !== a_key.on_delete ||
        m_key.on_update && m_key.on_update !== a_key.on_update) {
        diff.push({
          action: UPDATE,
          type: FOREIGN_KEY,
          definition: m_key,
          constraint_name: a_key.constraint_name
        });
      }
    }
  });

  Object.keys(actual_hash).forEach(key => {
    if (!model_hash[key]) {
      diff.push({
        action: DELETE,
        type: FOREIGN_KEY,
        constraint_name: actual_hash[key].constraint_name
      });
    }
  });

  return diff;
}

exports.diff_foreign_keys = diff_foreign_keys;
