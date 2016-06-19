const Model = require('./base');


var Budget = new Model('budget', [
  'region_id',
  'account'
], {});

Budget.get = function(id, cb) {
  var query = ' SELECT * FROM budget LIMIT 1';

  this.db.serialize(() => {
    this.db.get(query, function(err, row) {
      if(err) return cb(err);
      else {
        row.name = 'Бюджет';
        return cb(null, row);
      }
    });
  });
};

Budget.update = function(instance, cb) {
  var query = ' SELECT * FROM budget LIMIT 1';
  var query = 'UPDATE '
    + this.tableName
    + ' SET '
    + this.fields.map((item) => {
        return item + '=?';
      }).join(',');
    var values = this.fields.map((i) => {
      if( instance[i] !== undefined )
        return instance[i];
      if( this.defaults[i] !== undefined )
        return this.defaults[i];
      return null;
    });
    this.db.run(query, values, cb);
};

module.exports = Budget;
