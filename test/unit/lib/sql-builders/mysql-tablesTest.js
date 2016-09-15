'use strict';

var chai = require('chai'),
    expect = chai.expect;

describe('mysql-tables sql-builders', () => {
  var builder = require('../../../../lib/sql-builders/mysql-tables');

  describe('get_field_definition(name, properties)', () => {
    var get_field_definition = builder.get_field_definition;

    it('should build minimal sql partial', () => {
      var properties = {
        type: 'int'
      };
      var expected = 'foo INT';

      expect(get_field_definition('foo', properties)).to.equal(expected);
    });

    it('should build fully-loaded sql partial with auto increment', () => {
      var properties = {
        type: 'int',
        auto_increment: true,
        comment: 'dude',
        default: 1, // Skipped
        not_null: true,
        unique: true
      };
      var expected_parts = ['foo INT', 'AUTO_INCREMENT', "COMMENT 'dude'",
        'NOT NULL', 'UNIQUE'];

      var result = get_field_definition('foo', properties);
      expected_parts.forEach(part => {
        expect(result).to.include(part);
      });
      expect(result).to.not.include('DEFAULT');
    });

    it('should build fully-loaded sql partial with unique', () => {
      var properties = {
        type: 'int',
        comment: 'dude',
        default: 1, // Skipped
        not_null: true,
        unique: true
      };
      var expected_parts = ['foo INT', "COMMENT 'dude'", 'NOT NULL', 'UNIQUE'];

      var result = get_field_definition('foo', properties);
      expected_parts.forEach(part => {
        expect(result).to.include(part);
      });
      expect(result).to.not.include('DEFAULT');
    });

    it('should build fully-loaded sql partial with a default value', () => {
      var properties = {
        type: 'int',
        comment: 'dude',
        default: 1,
        not_null: true
      };
      var expected_parts = ['foo INT', "COMMENT 'dude'", 'DEFAULT 1', 'NOT NULL'];

      var result = get_field_definition('foo', properties);
      expected_parts.forEach(part => {
        expect(result).to.include(part);
      });
    });

    it('should handle string default values', () => {
      var properties = {
        type: 'varchar-40',
        default: 'foo'
      };
      var expected_parts = ['foo VARCHAR', 'DEFAULT "foo"'];

      var result = get_field_definition('foo', properties);
      expected_parts.forEach(part => {
        expect(result).to.include(part);
      });
    });
  });
});
