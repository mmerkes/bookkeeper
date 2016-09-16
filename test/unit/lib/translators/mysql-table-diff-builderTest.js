'use strict';

var chai = require('chai'),
    expect = chai.expect,
    root = '../../../../lib/',
    Model = require(root + 'model'),
    TableDiffBuilder = require(root +'translators/mysql-table-diff-builder');

const ADD = 'add',
      UPDATE = 'update',
      DELETE = 'delete',
      PRIMARY_KEY = 'primary_key',
      FOREIGN_KEY = 'foreign_key',
      OTHER_TABLE = 'other';

describe('UNIT MySQL TableDiffBuilder', () => {
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
  var Example = new Model(example_fields, example_properties);

  describe('add_fields(fields)', () => {
    it('should turn mysql table info into a fields object for model on basic fields', () => {
      var diff_builder = new TableDiffBuilder(new Model({}, {
        name: 'Example'
      }));
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
      var diff_builder = new TableDiffBuilder(Example);

      diff_builder.add_fields(example_fields_info);
      expect(diff_builder).to.have.property('_fields').that.eql(example_fields);
    });

    it('should be idempotent', () => {
      var diff_builder = new TableDiffBuilder(Example);

      diff_builder.add_fields(example_fields_info);
      diff_builder.add_fields(example_fields_info);
      expect(diff_builder).to.have.property('_fields').that.eql(example_fields);
    });
  });

  describe('add_keys(key)', () => {
    it('should turn mysql table info into a properties object for complete keys', () => {
      var diff_builder = new TableDiffBuilder(Example);

      diff_builder.add_keys(example_keys_info);
      diff_builder._properties.name = 'Example'; // Added so eql check works
      expect(diff_builder).to.have.property('_properties').that.eql(example_properties);
    });

    it('should be idempotent', () => {
      var diff_builder = new TableDiffBuilder(Example);

      diff_builder.add_keys(example_keys_info);
      diff_builder.add_keys(example_keys_info);
      diff_builder._properties.name = 'Example'; // Added so eql check works
      expect(diff_builder).to.have.property('_properties').that.eql(example_properties);
    });
  });

  describe('diff_fields(model, actual)', () => {
    var diff_builder = new TableDiffBuilder(new Model({}, {
      name: 'Example'
    }));

    it('should ignore fields that match', () => {
      var model = {
        id: {
          type: 'int',
          auto_increment: true
        },
        foo: {
          type: 'varchar-40',
          unique: true
        }
      };
      var actual = model;

      expect(diff_builder.diff_fields(model, actual)).to.have.lengthOf(0);
    });

    it('should add fields that do not exist in actual', () => {
      var model = {
        id: {
          type: 'int',
          auto_increment: true
        },
        foo: {
          type: 'varchar-40',
          unique: true
        }
      };
      var actual = {
        id: {
          type: 'int',
          auto_increment: true
        }
      };

      var result = diff_builder.diff_fields(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(ADD);
      expect(result[0]).to.have.property('definition').that.equal(model.foo);
      expect(result[0]).to.have.property('name').that.equal('foo');
    });

    it('should update fields do not match model properties', () => {
      var model = {
        id: {
          type: 'int',
          auto_increment: true
        },
        foo: {
          type: 'varchar-40',
          unique: true
        }
      };
      var actual = {
        id: {
          type: 'int',
          auto_increment: true
        },
        foo: {
          type: 'varchar-60',
          unique: true
        }
      };

      var result = diff_builder.diff_fields(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('definition').that.equal(model.foo);
      expect(result[0]).to.have.property('name').that.equal('foo');
    });

    it('should delete fields that exist in actual and not the model', () => {
      var model = {
        id: {
          type: 'int',
          auto_increment: true
        }
      };
      var actual = {
        id: {
          type: 'int',
          auto_increment: true
        },
        foo: {
          type: 'varchar-40'
        }
      };

      var result = diff_builder.diff_fields(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(DELETE);
      expect(result[0]).to.have.property('name').that.equal('foo');
    });
  });

  describe('diff_primary_keys(model, actual)', () => {
    var diff_builder = new TableDiffBuilder(new Model({}, {
      name: 'Example'
    }));

    it('should do nothing if the model and actual match', () => {
      var model = ['foo'],
          actual = ['foo'];

      expect(diff_builder.diff_primary_keys(model, actual)).to.have.lengthOf(0);
    });

    it('should do nothing if model has no primary_key', () => {
      var model, actual; // Both as undefined
      expect(diff_builder.diff_primary_keys(model, actual)).to.have.lengthOf(0);
    });

    it('should do nothing if model has no keys in primary_key array', () => {
      var model = [], actual;
      expect(diff_builder.diff_primary_keys(model, actual)).to.have.lengthOf(0);
    });

    it('should delete the primary_key if exists in actual and not model', () => {
      var model,
          actual = ['foo'];

      var result = diff_builder.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(DELETE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
    });

    it('should delete the primary_key if exists in actual and is empty in model', () => {
      var model = [],
          actual = ['foo'];

      var result = diff_builder.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(DELETE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
    });

    it('should add the primary_key if not in actual', () => {
      var model = ['foo'],
          actual;

      var result = diff_builder.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(ADD);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });

    it('should add the primary_key if actual is empty', () => {
      var model = ['foo'],
          actual = [];

      var result = diff_builder.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(ADD);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });

    it('should update the primary_key if model has additional fields', () => {
      var model = ['foo', 'bar'],
          actual = ['foo'];

      var result = diff_builder.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });

    it('should update the primary_key if actual has additional fields', () => {
      var model = ['foo'],
          actual = ['foo', 'bar'];

      var result = diff_builder.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });

    it('should update the primary_key if model and actual fields differ', () => {
      var model = ['foo'],
          actual = ['bar'];

      var result = diff_builder.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });
  });
});
