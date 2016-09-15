'use strict';

var chai = require('chai'),
    expect = chai.expect;

describe('mysql-keys sql builder', () => {
  var builder = require('../../../../lib/sql-builders/mysql-keys');

  describe('foreign_key_to_sql', () => {
    var to_sql = builder.foreign_key_to_sql;

    it('should build a bare-bones foreign_key partial', () => {
      var foreign_key = {
        model: 'Example',
        mappings: {
          other_id: 'id'
        }
      };
      var expected = 'FOREIGN KEY (other_id) REFERENCES example (id)';

      expect(to_sql(foreign_key)).to.equal(expected);
    });

    it('should build a fully-loaded foreign_key partial', () => {
      var foreign_key = {
        model: 'Example',
        constraint: 'foo',
        on_delete: 'cascade',
        on_update: 'cascade',
        mappings: {
          other_id: 'id',
          other_prop: 'prop'
        }
      };
      var expected = 'CONSTRAINT foo FOREIGN KEY (other_id, other_prop) ' +
        'REFERENCES example (id, prop) ON DELETE CASCADE ON UPDATE CASCADE';

      expect(to_sql(foreign_key)).to.equal(expected);
    });
  });
});
