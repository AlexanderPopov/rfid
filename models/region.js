const Model = require('./base');

var Region = new Model('region', [
  'id',
  'name',
  'currency',
  'coef',
  'PIT',
  'ANP'  
], {
  coef: 1,
  PIT: 10,
  ANP: 10
});

module.exports = Region
