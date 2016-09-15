'use strict';

const VALID_REFERENCE_OPTIONS = ['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION'];

exports.get_reference_options = () => {
  return VALID_REFERENCE_OPTIONS;
};

function reference_option_is_valid(option) {
  return VALID_REFERENCE_OPTIONS.includes(option.toUpperCase());
}

exports.reference_option_is_valid = reference_option_is_valid;

// Complete foreign_key
// {
//   model: 'ModelName', // required
//   constraint: 'constraint_name', // optional
//   on_delete: 'cascade', // optional
//   on_update: 'cascade', // optional
//   mappings: { // required
//     model_field: 'foreign_field'
//   }
// }
function validate_foreign_key(fields, foreign_key) {
  if (!foreign_key.model) {
    throw new Error(`model property must be set for foreign_key ${JSON.stringify(foreign_key)}`);
  }

  if (!foreign_key.mappings || Object.keys(foreign_key.mappings).length === 0) {
    throw new Error(`mappings property must be set for foreign_key ${JSON.stringify(foreign_key)}`);
  }

  Object.keys(foreign_key.mappings).forEach(field => {
    if (!fields[field]) {
      throw new Error(`foreign_key mapping ${field} must be defined in fields object`);
    }
  });

  if (foreign_key.on_delete && !reference_option_is_valid(foreign_key.on_delete)) {
    throw new Error('foreign_key.on_delete must be a valid reference option, i.e. ' +
      `${VALID_REFERENCE_OPTIONS.join(', ')}. Actual: ${foreign_key.on_delete}`);
  }

  if (foreign_key.on_update && !reference_option_is_valid(foreign_key.on_update)) {
    throw new Error('foreign_key.on_update must be a valid reference option, i.e. ' +
      `${VALID_REFERENCE_OPTIONS.join(', ')}. Actual: ${foreign_key.on_update}`);
  }
}

exports.validate_foreign_key = validate_foreign_key;
