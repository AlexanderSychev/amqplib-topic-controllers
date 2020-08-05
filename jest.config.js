'use strict';

const path = require('path');

module.exports = {
  bail: true,
  testEnvironment: 'node',
  rootDir: path.join(__dirname, 'dist')
};
