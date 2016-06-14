const Model = require('./base');

var Firm = new Model('firm', [
  'id',
  'name',
  'account',
  'region_id',
  'type'
], {
  'account': 0.0,
  'type': 0
});

Firm.list = function(cb) {
  var query = 'SELECT '
    + ' t1.*, '
    + ' t2.name AS region_name, '
    + ' t2.currency AS region_currency, '
    + ' group_concat(t4.name || \' \' || t4.last_name, \';;;\') as cofounders'
    + ' FROM '
    + this.tableName + ' AS t1 '
    + ' LEFT JOIN '
    + ' region AS t2 ON t2.id = t1.region_id '
    + ' LEFT JOIN '
    + ' firm_citizen AS t3 ON t1.id = t3.firm_id '
    + ' LEFT JOIN '
    + ' citizen AS t4 ON t3.citizen_id = t4.card_id '
    + ' GROUP BY t1.id';

  this.db.serialize(() => {
    this.db.all(query, cb);
  });
}

Firm.insertCofounders = function(cf, firm_id, cb) {
  var query = 'INSERT INTO firm_citizen(firm_id, citizen_id, percent) '
    + ' VALUES(?,?,?)';
  this.db.serialize(() => {
    var stmt = this.db.prepare(query);
    cf.forEach((cofounder) => {
      stmt.run(firm_id, cofounder.card_id, cofounder.share);
    });
    stmt.finalize(cb);
  });
}

module.exports = Firm;
