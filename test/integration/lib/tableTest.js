'use strict';

var chai = require('chai'),
    expect = chai.expect,
    mysql = require('mysql'),
    async = require('async'),
    root = '../../../lib/',
    Model = require(root + 'model'),
    Table = require(root + 'table');

// TODO: Use table name generator
const TABLE_NAME = 'example';
const DATABASE = 'bookkeeper';
const OTHER_TABLE = "other";
const OTHER_TABLE2 = "other2";

describe('INTEGRATION Table', function () {
  var connection;

  before(function (done) {
    connection = mysql.createConnection({
      host: process.env.BOOKKEEPER_MYSQL_HOST,
      user: process.env.BOOKKEEPER_MYSQL_USER,
      password: process.env.BOOKKEEPER_MYSQL_PASSWORD,
      database: DATABASE
    });

    connection.connect(done);
  });

  function get_foreign_key_information (table, callback) {
    var query = 'SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, ' +
      'REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME ' +
      'FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE ' +
      `TABLE_NAME = "${table}"`;

    connection.query(query, callback);
  }

  describe('update_table(callback)', function () {
    describe('when table does not exist', function () {
      before(function (done) {
        // Let's just make sure that this got cleaned up.
        connection.query(`DROP TABLE IF EXISTS ${TABLE_NAME}`, done);
      });

      afterEach(function (done) {
        connection.query(`DROP TABLE IF EXISTS ${TABLE_NAME}`, done);
      });

      it('should create a table', function (done) {
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
        var table = new Table(Example, connection);
        var expectedFields = {
          id: 'int(11)',
          name: 'varchar(40)'
        };

        table.update_table(err => {
          if (err) return done(err);

          connection.query(`DESCRIBE ${TABLE_NAME}`, function (err, data) {
            if (err) return done(err);

            var foundAllMatches = Object.keys(expectedFields).reduce((pre, field) => {
              if (!pre) return false;

              return data.filter(properties => {
                return properties.Field === field &&
                       properties.Type === expectedFields[field];
              }).length === 1;
            }, true);
            expect(foundAllMatches).to.be.true;
            return done();
          });
        });
      });

      it('should add the primary key', function (done) {
        var Example = new Model({
          id: {
            type: 'int'
          },
          name: {
            type: 'varchar-40'
          }
        }, {
          name: 'Example',
          primary_key: ['id']
        });
        var table = new Table(Example, connection);
        var expectedFields = {
          id: 'int(11)',
          name: 'varchar(40)'
        };

        table.update_table(err => {
          if (err) return done(err);

          connection.query(`DESCRIBE ${TABLE_NAME}`, function (err, data) {
            if (err) return done(err);

            var foundAllMatches = Object.keys(expectedFields).reduce((pre, field) => {
              if (!pre) return false;

              return data.filter(properties => {
                return properties.Field === field &&
                       properties.Type === expectedFields[field];
              }).length === 1;
            }, true);
            expect(foundAllMatches).to.be.true;

            var hasPrimaryKey = data.filter(properties => {
              return properties.Field === 'id' &&
                     properties.Key === 'PRI';
            }).length === 1;
            expect(hasPrimaryKey).to.be.true;

            return done();
          });
        });
      });

      describe('with foreign keys', function () {
        before(function (done) {
          async.parallel([
            function (done) {
              var Other = new Model({
                id: {
                  type: 'int'
                }
              }, {
                name: 'Other',
                primary_key: ['id']
              });
              var table = new Table(Other, connection);
              table.update_table(done);
            },
            function (done) {
              var Other2 = new Model({
                id: {
                  type: 'int'
                }
              }, {
                name: 'Other2',
                primary_key: ['id']
              });
              var table = new Table(Other2, connection);
              table.update_table(done);
            }
          ], done);
        });

        after(function (done) {
          async.parallel([
            function (done) {
              connection.query(`DROP TABLE IF EXISTS ${OTHER_TABLE}`, done);
            },
            function (done) {
              connection.query(`DROP TABLE IF EXISTS ${OTHER_TABLE2}`, done);
            }
          ], done);
        });

        it('should add a foreign key', function (done) {
          var Example = new Model({
            id: {
              type: 'int'
            },
            other_id: {
              type: 'int'
            }
          }, {
            name: 'Example',
            foreign_keys: [{
              model: OTHER_TABLE,
              mappings: {
                other_id: 'id'
              }
            }]
          });
          var table = new Table(Example, connection);

          table.update_table(err => {
            if (err) return done(err);

            get_foreign_key_information('example', (err, data) => {
              if (err) return done(err);

              var hasForeignKey = data.filter(row => {
                return row.COLUMN_NAME === 'other_id' &&
                       row.REFERENCED_TABLE_NAME === OTHER_TABLE.toLowerCase() &&
                       row.REFERENCED_COLUMN_NAME === 'id';
              }).length === 1;
              expect(hasForeignKey).to.be.true;

              return done();
            });
          });
        });

        it('should add multiple foreign keys', function (done) {
          var Example = new Model({
            id: {
              type: 'int'
            },
            other_id: {
              type: 'int'
            },
            other2_id: {
              type: 'int'
            }
          }, {
            name: 'Example',
            foreign_keys: [{
              model: OTHER_TABLE,
              mappings: {
                other_id: 'id'
              }
            }, {
              model: OTHER_TABLE2,
              mappings: {
                other2_id: 'id'
              }
            }]
          });
          var table = new Table(Example, connection);

          table.update_table(err => {
            if (err) return done(err);

            get_foreign_key_information('example', (err, data) => {
              if (err) return done(err);

              var hasForeignKeys = data.filter(row => {
                return row.COLUMN_NAME === 'other_id' &&
                       row.REFERENCED_TABLE_NAME === OTHER_TABLE.toLowerCase() &&
                       row.REFERENCED_COLUMN_NAME === 'id' ||
                       row.COLUMN_NAME === 'other2_id' &&
                       row.REFERENCED_TABLE_NAME === OTHER_TABLE2.toLowerCase() &&
                       row.REFERENCED_COLUMN_NAME === 'id';
              }).length === 2;
              expect(hasForeignKeys).to.be.true;

              return done();
            });
          });
        });
      });
    });

    describe('when table does exist', function () {
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

      beforeEach(done => {
        async.waterfall([
          callback => {
            var table = new Table(Other, connection);
            table.update_table(callback);
          },
          (result, foo, callback) => {
            var table = new Table(Example, connection);
            table.update_table(callback);
          }
        ], done);
      });


      afterEach(done => {
        async.waterfall([
          callback => {
            connection.query(`DROP TABLE IF EXISTS ${TABLE_NAME}`, callback);
          },
          (result, foo, callback) => {
            connection.query(`DROP TABLE IF EXISTS ${OTHER_TABLE}`, callback);
          }
        ], done);
      });

      it('should remove any fields not in the model');

      it.skip('should add any new fields from the model', done => {
        var table = new Table(Example, connection);
        table.get_table_information((err, results) => {
          if (err) return done(err);

          console.log(JSON.stringify(results, null, 2));

          return done();
        });
      });

      it('should add the new primary_key');

      it('should add the new foreign_key');

      it('should remove any additional foreign_keys');
    });
  });
});
