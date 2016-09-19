'use strict';

var chai = require('chai'),
    expect = chai.expect,
    root = '../../../lib/',
    Model = require(root + 'model');

describe('UNIT Model', () => {
  describe('constructor', () => {
    var fields = {
      id: {
        type: 'int'
      },
      foo_id: {
        type: 'int'
      }
    };
    var properties = {
      name: 'Example',
      primary_key: ['id'],
      foreign_keys: [{
        model: 'Foo',
        mappings: {
          foo_id: 'id'
        }
      }]
    };

    it('should require fields', () => {
      expect(() => {
        new Model(undefined, properties);
      }).to.throw(/fields/i);
    });

    it('should require properties', () => {
      expect(() => {
        new Model(fields);
      }).to.throw(/properties/i);
    });

    it('should require a name to be set', () => {
      expect(() => {
        new Model(fields, {});
      }).to.throw(/name/i);
    });

    it('should set _fields and _properties to input', () => {
      var Example = new Model(fields, properties);
      expect(Example._fields).to.equal(fields);
      expect(Example._properties).to.equals(properties);
    });

    it('should throw if a field has no type', () => {
      var fields = {
        id: {
          type: 'int'
        },
        name: {}
      };
      var properties = {
        name: 'Example'
      };
      function test () {
        new Model(fields, properties);
      }
      expect(test).to.throw('type');
    });

    it('should throw if a field does not have a valid type', () => {
      var fields = {
        id: {
          type: 'foo'
        },
        name: {
          type: 'varchar-40'
        }
      };
      var properties = {
        name: 'Example'
      };
      function test () {
        new Model(fields, properties);
      }
      expect(test).to.throw('foo');
    });

    it('should throw if primary_key is not defined in fields', () => {
      var fields = {
        id: {
          type: 'int'
        },
        name: {
          type: 'varchar-40'
        }
      };
      var properties = {
        name: 'Example',
        primary_key: ['foo']
      };
      function test () {
        new Model(fields, properties);
      }
      expect(test).to.throw('primary_key');
    });

    it('should throw if foreign_key is invalid', () => {
      var fields = {
        id: {
          type: 'int'
        },
        foo_id: {
          type: 'int'
        }
      };
      var properties = {
        name: 'Example',
        foreign_keys: [{
          mappings: {
            foo_id: 'id'
          }
        }]
      };
      function test () {
        new Model(fields, properties);
      }
      expect(test).to.throw('foreign_key');
    });

  });
});
