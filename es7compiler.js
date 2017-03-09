#!/usr/bin/env node
require('babel-register');
require('babel-polyfill');
const app = require('./main.js');
app();
