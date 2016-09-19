'use strict';

exports.debug = function debug(str) {
  if (process.env.BOOKKEEPER_DEBUG) {
    console.log('WTF!!!');
    console.log(str);
  }
};
