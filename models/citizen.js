const Model = require('./base');

var Citizen = new Model('citizen', [
  'card_id',
  'name',
  'last_name',
  'account',
  'account_number',
  'pension',
  'region_id'
], {
  'account': 0.0,
  'pension': 0.0
});

Citizen.list = function(cb) {
  var query = 'SELECT '
    + ' t1.*, '
    + ' t2.name AS region_name, '
    + ' t2.currency AS region_currency '
    + ' FROM '
    + this.tableName + ' AS t1 '
    + ' LEFT JOIN '
    + ' region AS t2 ON t2.id = t1.region_id ';

  this.db.serialize(() => {
    this.db.all(query, cb);
  });
}

Citizen.find = function(card_id, acc_n, cb) {
  var query = 'SELECT '
    + ' * FROM '
    + this.tableName
    + ' WHERE '
    + (card_id ? ' card_id=\'' + card_id + '\' ' : '')
    + (acc_n ? ' account_number=\'' + acc_n + '\' ' : '')
    + 'LIMIT 1';
  this.db.serialize(() => {
    this.db.get(query, cb);
  });
}

module.exports = Citizen;
