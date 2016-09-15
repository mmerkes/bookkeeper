'use strict';

var chai = require('chai'),
    expect = chai.expect,
    mysql = require('mysql'),
    root = '../../../lib/',
    Model = require(root + 'model'),
    Table = require(root + 'table');

describe('UNIT Table', function () {
  var Example = new Model({
    id: {
      type: 'int'
    },
    name: {
      type: 'varchar-40'
    }
  }, {
    name: 'Example'
  });

  var connection = mysql.createConnection({ port: 3000 });

  describe('constructor', function () {
    it('should throw if not passed an instance of Model', function () {
      function test () {
        new Table({}, connection);
      }
      expect(test).to.throw('Model');
    });

    it('should throw if not passed a connection', function () {
      function test () {
        new Table(Example);
      }
      expect(test).to.throw('connection');
    });

    it('should throw if connection is not a mysql connection', function () {
      function test () {
        new Table(Example, {});
      }
      expect(test).to.throw('connection');
    });

    it('should store the model and connection internally', function () {
      var table = new Table(Example, connection);

      expect(table).to.have.property('model').that.equals(Example);
      expect(table).to.have.property('connection').that.equals(connection);
    });
  });
});
