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
      FOREIGN_KEY = 'foreign_key';

describe('UNIT MySQL TableDiffBuilder', () => {
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
