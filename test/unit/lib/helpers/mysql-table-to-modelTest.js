'use strict';

var chai = require('chai'),
    expect = chai.expect,
    root = '../../../../lib/',
    Model = require(root + 'model'),
    MySQLTableToModel = require(root +'helpers/mysql-table-to-model');

const OTHER_TABLE = 'other';

describe('UNIT MySQLTableToModel', () => {
  var example_fields = {
    id: {
      type: 'int-4',
      auto_increment: true,
      not_null: true,
      comment: 'foobar'
    },
    other_id: {
      not_null: true,
      type: 'int-4'
    },
    other_id2: {
      type: 'int-4'
    },
    foo: {
      type: 'varchar-40',
      default: 'foo',
      not_null: true
    },
    bar: {
      type: 'varchar-20',
      unique: true
    }
  };
  var example_properties = {
    name: 'Example',
    primary_key: ['id', 'other_id'],
    foreign_keys: [{
      model: OTHER_TABLE,
      constraint_name: 'example_ibfk_1',
      mappings: {
        other_id: 'id',
        other_id2: 'id2'
      },
      on_delete: 'NO ACTION',
      on_update: 'CASCADE'
    }]
  };
  var example_fields_info = [{
    "Field": "id",
    "Type": "int(11)",
    "Collation": null,
    "Null": "NO",
    "Key": "PRI",
    "Default": null,
    "Extra": "auto_increment",
    "Privileges": "select,insert,update,references",
    "Comment": "foobar"
  },
  {
    "Field": "other_id",
    "Type": "int(11)",
    "Collation": null,
    "Null": "NO",
    "Key": "PRI",
    "Default": null,
    "Extra": "",
    "Privileges": "select,insert,update,references",
    "Comment": ""
  },
  {
    "Field": "other_id2",
    "Type": "int(11)",
    "Collation": null,
    "Null": "YES",
    "Key": "",
    "Default": null,
    "Extra": "",
    "Privileges": "select,insert,update,references",
    "Comment": ""
  },
  {
    "Field": "foo",
    "Type": "varchar(40)",
    "Collation": "latin1_swedish_ci",
    "Null": "NO",
    "Key": "",
    "Default": "foo",
    "Extra": "",
    "Privileges": "select,insert,update,references",
    "Comment": ""
  },
  {
    "Field": "bar",
    "Type": "varchar(20)",
    "Collation": "latin1_swedish_ci",
    "Null": "YES",
    "Key": "UNI",
    "Default": null,
    "Extra": "",
    "Privileges": "select,insert,update,references",
    "Comment": ""
  }];
  var example_keys_info = [{
    "COLUMN_NAME": "other_id",
    "REFERENCED_TABLE_NAME": "other",
    "REFERENCED_COLUMN_NAME": "id",
    "CONSTRAINT_NAME": "example_ibfk_1",
    "UPDATE_RULE": "CASCADE",
    "DELETE_RULE": "NO ACTION"
  },
  {
    "COLUMN_NAME": "other_id2",
    "REFERENCED_TABLE_NAME": "other",
    "REFERENCED_COLUMN_NAME": "id2",
    "CONSTRAINT_NAME": "example_ibfk_1",
    "UPDATE_RULE": "CASCADE",
    "DELETE_RULE": "NO ACTION"
  },
  {
    "COLUMN_NAME": "id",
    "REFERENCED_TABLE_NAME": null,
    "REFERENCED_COLUMN_NAME": null,
    "CONSTRAINT_NAME": "PRIMARY",
    "UPDATE_RULE": null,
    "DELETE_RULE": null
  },
  {
    "COLUMN_NAME": "other_id",
    "REFERENCED_TABLE_NAME": null,
    "REFERENCED_COLUMN_NAME": null,
    "CONSTRAINT_NAME": "PRIMARY",
    "UPDATE_RULE": null,
    "DELETE_RULE": null
  },
  {
    "COLUMN_NAME": "bar",
    "REFERENCED_TABLE_NAME": null,
    "REFERENCED_COLUMN_NAME": null,
    "CONSTRAINT_NAME": "bar",
    "UPDATE_RULE": null,
    "DELETE_RULE": null
  }];

  describe('add_fields(fields)', () => {
    it('should turn mysql table info into a fields object for model on basic fields', () => {
      var diff_builder = new MySQLTableToModel('Example');
      var fields = [{
        "Field": "id",
        "Type": "int(11)",
        "Collation": null,
        "Null": "YES",
        "Key": "",
        "Default": null,
        "Extra": "",
        "Privileges": "select,insert,update,references",
        "Comment": ""
      }];
      var expected = {
        id: {
          type: 'int-4'
        }
      };

      diff_builder.add_fields(fields);
      expect(diff_builder).to.have.property('_fields').that.eql(expected);
    });

    it('should turn mysql table info into a fields object for complete fields', () => {
      var diff_builder = new MySQLTableToModel('Example');

      diff_builder.add_fields(example_fields_info);
      expect(diff_builder).to.have.property('_fields').that.eql(example_fields);
    });

    it('should be idempotent', () => {
      var diff_builder = new MySQLTableToModel('Example');

      diff_builder.add_fields(example_fields_info);
      diff_builder.add_fields(example_fields_info);
      expect(diff_builder).to.have.property('_fields').that.eql(example_fields);
    });
  });

  describe('add_keys(key)', () => {
    it('should turn mysql table info into a properties object for complete keys', () => {
      var diff_builder = new MySQLTableToModel('Example');

      diff_builder.add_keys(example_keys_info);
      diff_builder._properties.name = 'Example'; // Added so eql check works
      expect(diff_builder).to.have.property('_properties').that.eql(example_properties);
    });

    it('should be idempotent', () => {
      var diff_builder = new MySQLTableToModel('Example');

      diff_builder.add_keys(example_keys_info);
      diff_builder.add_keys(example_keys_info);
      diff_builder._properties.name = 'Example'; // Added so eql check works
      expect(diff_builder).to.have.property('_properties').that.eql(example_properties);
    });
  });

  describe('build()', () => {
    it('should not break if no keys or fields are added', () => {
      var diff_builder = new MySQLTableToModel('Example');
      var model = diff_builder.build();
      var expected_fields = {};
      var expected_properties = {
        name: 'Example'
      };

      expect(model).to.have.property('_fields').that.eql(expected_fields);
      expect(model).to.have.property('_properties').that.eql(expected_properties);
    });

    it('should build a model based on added fields and keys', () => {
      var diff_builder = new MySQLTableToModel('Example');
      var model = diff_builder.add_fields(example_fields_info)
        .add_keys(example_keys_info)
        .build();

      expect(model).to.have.property('_fields').that.eql(example_fields);
      expect(model).to.have.property('_properties').that.eql(example_properties);
    });
  });
});
