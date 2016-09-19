'use strict';

var sinon = require('sinon'),
    chai = require('chai'),
    expect = chai.expect,
    logger = require('../../../../lib/helpers/logger');

describe('UNIT logger', () => {
  describe('debug(str)', () => {
    var BOOKKEEPER_DEBUG, sandbox;
    before(() => {
      BOOKKEEPER_DEBUG = process.env.BOOKKEEPER_DEBUG;
      console.log('BOOKKEEPER_DEBUG ' + BOOKKEEPER_DEBUG);
    });

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.spy(console, 'log');
    });

    afterEach(() => {
      sandbox.restore();
    });

    after(() => {
      process.env.BOOKKEEPER_DEBUG = BOOKKEEPER_DEBUG;
    });

    it('should not log if BOOKKEEPER_DEBUG is unset', () => {
      process.env.BOOKKEEPER_DEBUG = '';
      logger.debug('foo');

      expect(console.log.called).to.be.false;
    });

    it('should log if BOOKKEEPER_DEBUG is set', () => {
      process.env.BOOKKEEPER_DEBUG = 'true';
      logger.debug('foo');

      expect(console.log.called).to.be.true;
    });
  });
});
