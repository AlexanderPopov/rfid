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

Citizen.get = function(id, cb) {
  var query = 'SELECT * FROM ' 
    + this.tableName 
    + ' WHERE card_id=$1'
    + ' LIMIT 1';

  this.db.serialize(() => {
    this.db.get(query, [id], cb);
  });
};

Citizen.update = function(instance, cb) {
  var query = 'UPDATE '
    + this.tableName
    + ' SET '
    + this.fields.map((item) => {
        return item + '=?';
      }).join(',')
    + ' WHERE card_id = ?';
    var values = this.fields.map((i) => {
      if( instance[i] !== undefined )
        return instance[i];
      if( this.defaults[i] !== undefined )
        return this.defaults[i];
      return null;
    });
    values.push(instance.card_id);
    this.db.run(query, values, cb);
};

module.exports = Citizen;
