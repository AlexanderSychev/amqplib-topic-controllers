'use strict';

const path = require('path');

module.exports = {
  bail: true,
  testEnvironment: 'node',
  rootDir: path.join(__dirname, 'dist'),
  testTimeout: 1000 * 60 * 5, // 5 minutes test timeout
};
