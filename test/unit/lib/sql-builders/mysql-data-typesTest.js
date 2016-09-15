'use strict';

var chai = require('chai'),
    expect = chai.expect;

describe('UNIT data-types helper', () => {
  var data_types = require('../../../../lib/sql-builders/mysql-data-types');

  describe('data_type_to_sql(type)', () => {
    var converter = data_types.data_type_to_sql;

    describe('VARCHAR', () => {
      it('should convert a valid VARCHAR', () => {
        expect(converter('varchar-20')).to.equal('VARCHAR(20)');
        expect(converter('varchar-1020')).to.equal('VARCHAR(1020)');
      });

      it('should throw if no size', () => {
        expect(converter.bind(null, 'varchar')).to.throw('size');
        expect(converter.bind(null, 'varchar-')).to.throw('size');
      });

      it('should throw if given invalid size', () => {
        expect(converter.bind(null, 'varchar--1')).to.throw('size');
        expect(converter.bind(null, 'varchar-0')).to.throw('size');
        expect(converter.bind(null, 'varchar-1000000')).to.throw('size');
        expect(converter.bind(null, 'varchar-foo')).to.throw('size');
        expect(converter.bind(null, 'varchar-10bananas')).to.throw('size');
      });
    });

    describe('INT (and all integer types)', () => {
      it('should return default int if no size given', () => {
        expect(converter('int')).to.equals('INT');
      });

      it('should return of a valid int of the appropriate size', () => {
        expect(converter('int-1')).to.equal('TINYINT');
        expect(converter('int-2')).to.equal('SMALLINT');
        expect(converter('int-3')).to.equal('MEDIUMINT');
        expect(converter('int-4')).to.equal('INT');
        expect(converter('int-8')).to.equal('BIGINT');
      });

      it('should throw if invalid int size', () => {
        expect(converter.bind(null, 'int-0')).to.throw('size');
        expect(converter.bind(null, 'int-6')).to.throw('size');
        expect(converter.bind(null, 'int-20')).to.throw('size');
        expect(converter.bind(null, 'int-u5')).to.throw('size');
        expect(converter.bind(null, 'int-u20')).to.throw('size');
        expect(converter.bind(null, 'int-foo')).to.throw('size');
        expect(converter.bind(null, 'int-10bananas')).to.throw('size');
      });

      it('should accept unsigned ints', () => {
        expect(converter('int-u1')).to.equal('TINYINT UNSIGNED');
        expect(converter('int-u4')).to.equal('INT UNSIGNED');
        expect(converter('int-u8')).to.equal('BIGINT UNSIGNED');
      });
    });
  });

  describe('is_string_type(type)', () => {
    it('should return false for non-string types', () => {
      var types = ['int', 'int-8', 'foo'];

      types.forEach(type => {
        expect(data_types.is_string_type(type)).to.be.false;
      });
    });

    it('should return true for string types', () => {
      var types = ['varchar-40'];

      types.forEach(type => {
        expect(data_types.is_string_type(type)).to.be.true;
      });
    });
  });

  describe('sql_to_data_type(type)', () => {

    it('should throw if size is invalid', () => {
      var invalid = ['foobar', 'int(12)', 'varchar()', 'varchar(ab)', 'varchar'];

      invalid.forEach(type => {
        expect(data_types.sql_to_data_type.bind(null, type)).to.throw(invalid);
      });
    });

    describe('INT (and all integer types)', () => {
      it('should handle all supported integer sizes', () => {
        var valid = {
          'tinyint(4)': 'int-1',
          'smallint(6)': 'int-2',
          'mediumint(9)': 'int-3',
          'int(11)': 'int-4',
          'bigint(20)': 'int-8'
        };

        Object.keys(valid).forEach(key => {
          expect(data_types.sql_to_data_type(key)).to.equal(valid[key]);
        });
      });
    });

    describe('VARCHAR', () => {
      it('should handle different sizes', () => {
        var valid = {
          'varchar(40)': 'varchar-40',
          'varchar(200)': 'varchar-200'
        };


        Object.keys(valid).forEach(key => {
          expect(data_types.sql_to_data_type(key)).to.equal(valid[key]);
        });
      });
    });
  });
});
