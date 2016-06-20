const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('ssg.db');

var Model = function(tableName, fields, defaults) {
  this.tableName = tableName || null;
  this.fields = fields || [];
  this.defaults = defaults || {};
  this.db = db;
};

Model.prototype.list = function(cb) {
  var query = 'SELECT * FROM ' + this.tableName;

  db.serialize(() => {
    db.all(query, cb);
  });
};

Model.prototype.get = function(id, cb) {
  var query = 'SELECT * FROM ' 
    + this.tableName 
    + ' WHERE id=$1'
    + ' LIMIT 1';

  db.serialize(() => {
    db.get(query, [id], cb);
  });
};

Model.prototype.update = function(instance, cb) {
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
    db.run(query, values, cb);
};

Model.prototype.insert = function(instance, cb) {
  var query = '';
  db.serialize(() => {
    var query = 'INSERT INTO '
      + this.tableName
      + ' ('
      + this.fields.join(',')
      +  ') VALUES ('
      + this.fields.map(() => { return '?' }).join(',')
      + ')';

    var values = this.fields.map((i) => {
      if( instance[i] !== undefined )
        return instance[i];
      if( this.defaults[i] !== undefined )
        return this.defaults[i];
      return null;
    });

    db.run(query, values, (err) => {
      if( err ) {
        console.log(err);
        cb(err);
      }
      else {
        db.get('SELECT last_insert_rowid() as id', cb);
      };
    });
  });
};

Model.prototype.delete = function(id, cb) {
};


module.exports = Model;
