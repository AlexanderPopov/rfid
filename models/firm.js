const Model = require('./base');

var Firm = new Model('firm', [
  'id',
  'name',
  'account',
  'region_id',
  'type',
  'account_number'
], {
  'account': 0.0,
  'type': 0
});

Firm.list = function(cb) {
  var query = 'SELECT '
    + ' t1.*, '
    + ' t2.name AS region_name, '
    + ' t2.currency AS region_currency, '
    + ' t2.coef AS coef, '
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

Firm.find = function(acc_n, cb) {
  var query = 'SELECT '
    + ' * FROM '
    + this.tableName
    + ' WHERE '
    + ' account_number=\'' + acc_n + '\' '
    + 'LIMIT 1';
  this.db.serialize(() => {
    this.db.get(query, cb);
  });
}

Firm.updateForPension = function(instance, sum, cb) {
  var query = 'UPDATE '
    + this.tableName
    + ' SET '
    + this.fields.map((item) => {
        return item + '=?';
      }).join(',')
    + ' WHERE id = ?';
    var values = this.fields.map((i) => {
      if( instance[i] !== undefined )
        return instance[i];
      if( this.defaults[i] !== undefined )
        return this.defaults[i];
      return null;
    });
    values.push(instance.id);

    var cofSelect = `
      SELECT
        fc.citizen_id,
        fc.percent,
        fc.firm_id,
        c.region_id,
        r.ANP,
        r.PIT
      FROM
        firm_citizen AS fc
      LEFT JOIN
        citizen AS c
          ON c.card_id = fc.citizen_id
      LEFT JOIN
        region AS r
          ON r.id = c.region_id
      WHERE
        fc.firm_id = ?
    `;

    var updateQuery = `
      UPDATE citizen
      SET pension = pension + ?
      WHERE card_id = ?
    `;


    this.db.serialize(() => {
      this.db.run(query, values);
      this.db.all(cofSelect, [instance.id], (err, rows) => {
        if( err ) return cb(err);
        for( var i = 0; i < rows.length; i++ ) {
          var cofId = rows[i].citizen_id;
          var cofShare = rows[i].percent;
          var cofANP = rows[i].ANP;
          var cofSum = sum * (cofShare / 100);
          cofSum = cofSum * ((100 - cofANP) / 100);
          cofSum = cofSum.toFixed(2);
          this.db.run(updateQuery, [cofSum, cofId]);
        }
        cb(null); 
      });
    });
}

module.exports = Firm;
