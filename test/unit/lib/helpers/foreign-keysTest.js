'use strict';

var chai = require('chai'),
    expect = chai.expect,
    helper = require('../../../../lib/helpers/foreign-keys');

describe('UNIT foreign-keys helper', () => {
  var fields = {
    id: {
      type: 'int'
    },
    ex_id: {
      type: 'int'
    },
    ex_prop: {
      type: 'int'
    }
  };

  describe('get_reference_options()', () => {
    var options = helper.get_reference_options();

    expect(options).to.have.property('length').that.is.gt(1);
    expect(options).to.include('CASCADE');
  });

  describe('validate_foreign_key(fields, foreign_key)', () => {
    it('should throw if model property is not set', () => {
      var foreign_key = {
        mappings: { // required
          ex_id: 'id'
        }
      };

      expect(helper.validate_foreign_key.bind(null, fields, foreign_key))
        .to.throw('mapping');
    });

    it('should throw if mappings is not set', () => {
      var foreign_key = {
        model: 'ModelName'
      };

      expect(helper.validate_foreign_key.bind(null, fields, foreign_key))
        .to.throw('mappings');
    });

    it('should throw if mappings is empty', () => {
      var foreign_key = {
        model: 'ModelName',
        mappings: {}
      };

      expect(helper.validate_foreign_key.bind(null, fields, foreign_key))
        .to.throw('mappings');
    });

    it('should throw if mappings field is not in model fields', () => {
      var foreign_key = {
        model: 'ModelName', // required
        mappings: { // required
          ex_id: 'id',
          duke: 'nukem'
        }
      };

      expect(helper.validate_foreign_key.bind(null, fields, foreign_key))
        .to.throw('mapping');
    });

    it('should throw if on_delete property is invalid', () => {
      var foreign_key = {
        model: 'ModelName', // required
        mappings: { // required
          ex_id: 'id'
        },
        on_delete: 'foo'
      };

      expect(helper.validate_foreign_key.bind(null, fields, foreign_key))
        .to.throw('on_delete');
    });

    it('should throw if on_update property is invalid', () => {
      var foreign_key = {
        model: 'ModelName', // required
        mappings: { // required
          ex_id: 'id'
        },
        on_update: 'foo'
      };

      expect(helper.validate_foreign_key.bind(null, fields, foreign_key))
        .to.throw('on_update');
    });

    it('should validate a bare bones foreign_key', () => {
      var foreign_key = {
        model: 'ModelName', // required
        mappings: { // required
          ex_id: 'id'
        }
      };

      expect(helper.validate_foreign_key.bind(null, fields, foreign_key))
        .to.not.throw();
    });

    it('should validate a foreign_key with all the bells and whistles', () => {
      var foreign_key = {
        model: 'ModelName', // required
        constraint: 'constraint_name', // optional
        on_delete: 'cascade', // optional
        on_update: 'cascade', // optional
        mappings: { // required
          ex_id: 'id',
          ex_prop: 'prop'
        }
      };

      expect(helper.validate_foreign_key.bind(null, fields, foreign_key))
        .to.not.throw();
    });
  });
});
