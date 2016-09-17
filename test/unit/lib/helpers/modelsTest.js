'use strict';

var chai = require('chai'),
    expect = chai.expect,
    root = '../../../../lib/',
    Model = require(root + 'model'),
    models_helper = require(root +'helpers/models');

const ADD = 'add',
      UPDATE = 'update',
      DELETE = 'delete',
      PRIMARY_KEY = 'primary_key',
      FOREIGN_KEY = 'foreign_key',
      OTHER_TABLE = 'other';

describe('UNIT MySQL TableDiffBuilder', () => {
  describe('diff_models(model, actual)', () => {
    var Example = new Model({
      id: {
        type: 'int',
        auto_increment: true,
        comment: 'foobar'
      },
      other_id: {
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
    }, {
      name: 'Example',
      primary_key: ['id', 'other_id'],
      foreign_keys: [{
        model: OTHER_TABLE,
        mappings: {
          other_id: 'id',
          other_id2: 'id2'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }]
    });
    var Other = new Model({
      id: {
        type: 'int'
      },
      id2: {
        type: 'int'
      }
    }, {
      name: 'Other',
      primary_key: ['id', 'id2']
    });

    it('should diff two models');

    it('should return no diff if model compared to self', () => {
      var results = models_helper.diff_models(Example, Example);
      expect(results).to.have.property('fields').that.is.lengthOf(0);
      expect(results).to.have.property('properties').that.is.lengthOf(0);
    });
  });

  describe('diff_fields(model, actual)', () => {
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

      expect(models_helper.diff_fields(model, actual)).to.have.lengthOf(0);
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

      var result = models_helper.diff_fields(model, actual);
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

      var result = models_helper.diff_fields(model, actual);
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

      var result = models_helper.diff_fields(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(DELETE);
      expect(result[0]).to.have.property('name').that.equal('foo');
    });
  });

  describe('diff_primary_keys(model, actual)', () => {
    it('should do nothing if the model and actual match', () => {
      var model = ['foo'],
          actual = ['foo'];

      expect(models_helper.diff_primary_keys(model, actual)).to.have.lengthOf(0);
    });

    it('should do nothing if model has no primary_key', () => {
      var model, actual; // Both as undefined
      expect(models_helper.diff_primary_keys(model, actual)).to.have.lengthOf(0);
    });

    it('should do nothing if model has no keys in primary_key array', () => {
      var model = [], actual;
      expect(models_helper.diff_primary_keys(model, actual)).to.have.lengthOf(0);
    });

    it('should delete the primary_key if exists in actual and not model', () => {
      var model,
          actual = ['foo'];

      var result = models_helper.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(DELETE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
    });

    it('should delete the primary_key if exists in actual and is empty in model', () => {
      var model = [],
          actual = ['foo'];

      var result = models_helper.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(DELETE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
    });

    it('should add the primary_key if not in actual', () => {
      var model = ['foo'],
          actual;

      var result = models_helper.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(ADD);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });

    it('should add the primary_key if actual is empty', () => {
      var model = ['foo'],
          actual = [];

      var result = models_helper.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(ADD);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });

    it('should update the primary_key if model has additional fields', () => {
      var model = ['foo', 'bar'],
          actual = ['foo'];

      var result = models_helper.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });

    it('should update the primary_key if actual has additional fields', () => {
      var model = ['foo'],
          actual = ['foo', 'bar'];

      var result = models_helper.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });

    it('should update the primary_key if model and actual fields differ', () => {
      var model = ['foo'],
          actual = ['bar'];

      var result = models_helper.diff_primary_keys(model, actual);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(PRIMARY_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model);
    });
  });

  describe('diff_foreign_keys(model, actual)', () => {
    it('should add new foreign_keys', () => {
      var model = [{
        model: OTHER_TABLE,
        mappings: {
          other_id: 'id',
          other_id2: 'id2'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }];
      var actual = [];

      var result = models_helper.diff_foreign_keys(model, actual);
      expect(result).to.be.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(ADD);
      expect(result[0]).to.have.property('type').that.equal(FOREIGN_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model[0]);
    });

    it('should update foreign keys with new fields', () => {
      var model = [{
        model: OTHER_TABLE,
        mappings: {
          other_id: 'id',
          other_id2: 'id2'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }];
      var actual = [{
        model: OTHER_TABLE,
        constraint_name: 'fk1',
        mappings: {
          other_id: 'id'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }];

      var result = models_helper.diff_foreign_keys(model, actual);
      expect(result).to.be.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(FOREIGN_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model[0]);
      expect(result[0]).to.have.property('constraint_name').that.equal(actual[0].constraint_name);
    });

    it('should update foreign keys with unused fields', () => {
      var model = [{
        model: OTHER_TABLE,
        mappings: {
          other_id: 'id'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }];
      var actual = [{
        model: OTHER_TABLE,
        constraint_name: 'fk1',
        mappings: {
          other_id: 'id',
          other_id2: 'id2'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }];

      var result = models_helper.diff_foreign_keys(model, actual);
      expect(result).to.be.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(FOREIGN_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model[0]);
      expect(result[0]).to.have.property('constraint_name').that.equal(actual[0].constraint_name);
    });

    it('should delete unused foreign keys', () => {
      var model = [];
      var actual = [{
        model: OTHER_TABLE,
        constraint_name: 'fk1',
        mappings: {
          other_id: 'id',
          other_id2: 'id2'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }];

      var result = models_helper.diff_foreign_keys(model, actual);
      expect(result).to.be.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(DELETE);
      expect(result[0]).to.have.property('type').that.equal(FOREIGN_KEY);
      expect(result[0]).to.have.property('constraint_name').that.equal(actual[0].constraint_name);
    });

    it('should delete and add foreign_key if constraint_name is set in model and does not match', () => {
      var model = [{
        model: OTHER_TABLE,
        constraint_name: 'fk2',
        mappings: {
          other_id: 'id'
        }
      }];
      var actual = [{
        model: OTHER_TABLE,
        constraint_name: 'fk1',
        mappings: {
          other_id: 'id'
        },
        on_delete: 'CASCADE',
        on_update: 'CASCADE'
      }];

      var result = models_helper.diff_foreign_keys(model, actual);
      expect(result).to.be.lengthOf(2);
      expect(result[0]).to.have.property('action').that.equal(DELETE);
      expect(result[0]).to.have.property('type').that.equal(FOREIGN_KEY);
      expect(result[0]).to.have.property('constraint_name').that.equal(actual[0].constraint_name);
      expect(result[1]).to.have.property('action').that.equal(ADD);
      expect(result[1]).to.have.property('type').that.equal(FOREIGN_KEY);
      expect(result[1]).to.have.property('definition').that.eql(model[0]);
    });

    it('should update foreign_keys if on_delete is different', () => {
      var model = [{
        model: OTHER_TABLE,
        mappings: {
          other_id: 'id'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }];
      var actual = [{
        model: OTHER_TABLE,
        constraint_name: 'fk1',
        mappings: {
          other_id: 'id'
        },
        on_delete: 'CASCADE',
        on_update: 'CASCADE'
      }];

      var result = models_helper.diff_foreign_keys(model, actual);
      expect(result).to.be.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(FOREIGN_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model[0]);
      expect(result[0]).to.have.property('constraint_name').that.equal(actual[0].constraint_name);
    });

    it('should update foreign_keys if on_update is different', () => {
      var model = [{
        model: OTHER_TABLE,
        mappings: {
          other_id: 'id'
        },
        on_delete: 'NO ACTION',
        on_update: 'NO ACTION'
      }];
      var actual = [{
        model: OTHER_TABLE,
        constraint_name: 'fk1',
        mappings: {
          other_id: 'id'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }];

      var result = models_helper.diff_foreign_keys(model, actual);
      expect(result).to.be.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(FOREIGN_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model[0]);
      expect(result[0]).to.have.property('constraint_name').that.equal(actual[0].constraint_name);
    });

    it('should diff multiple foreign_keys', () => {
      var model = [{
        model: OTHER_TABLE,
        mappings: {
          other_id: 'id'
        },
        on_delete: 'NO ACTION',
        on_update: 'NO ACTION'
      }, {
        model: 'other2',
        mappings: {
          other_id: 'id'
        }
      }];
      var actual = [{
        model: OTHER_TABLE,
        constraint_name: 'fk1',
        mappings: {
          other_id: 'id',
          other_id2: 'id2'
        },
        on_delete: 'NO ACTION',
        on_update: 'CASCADE'
      }, {
        model: 'other2',
        mappings: {
          other_id: 'id'
        },
        on_delete: 'NO ACTION',
        on_update: 'NO ACTION'
      }];

      var result = models_helper.diff_foreign_keys(model, actual);
      expect(result).to.be.lengthOf(1);
      expect(result[0]).to.have.property('action').that.equal(UPDATE);
      expect(result[0]).to.have.property('type').that.equal(FOREIGN_KEY);
      expect(result[0]).to.have.property('definition').that.eql(model[0]);
      expect(result[0]).to.have.property('constraint_name').that.equal(actual[0].constraint_name);
    });
  });
});
