const express = require('express');
const exphbs = require('express-handlebars');
var app = express();
const async = require('async');

const bodyParser = require('body-parser')

var Region = require('./models/region');
var Citizen = require('./models/citizen');
var Firm = require('./models/firm');
var Transaction = require('./models/transaction');
var Budget = require('./models/budget');

const extend = require('util')._extend;

// 2685db48


app.use(express.static('public'));
app.set('views', __dirname + '/views');
app.engine('handlebars', exphbs.create({
}).engine);
app.set('view engine', 'handlebars');


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  Region.list(function(err, regions) {
    if( err ) {
      res.status(500).send(err);
    } else {
      res.render('firms', {layout: 'main', regions: regions});
    }
  });
});

app.get('/people', (req, res) => {
  Region.list(function(err, regions) {
    if( err ) {
      res.status(500).send(err);
    } else {
      res.render('people', {regions: regions});
    }
  });
});

app.get('/people/list', (req, res) => {
  Citizen.list((err, rows) => {
    if( err ) {
      console.log(err);
      res.status(500).send(err);
    }

    res.send(rows);
  });
});

app.get('/people/find', (req, res) => {
  var account_number = req.query.account_number;
  var card_id = req.query.card_id;
  if( !card_id && !account_number ) {
    res.status(404).send('Нет параметров');
    return;
  }

  Citizen.find(card_id, account_number, (err, citizen) => {
    if( err ) {
      console.log(err);
      res.status(500).send(err);
    } else if(!citizen)
      res.status(404).send('Не найден');
    else 
      res.send(citizen);
  });
});

app.post('/people/insert', (req, res) => {
  Citizen.insert(req.body, (err) => {
    if( err ) {
      console.log(err)
      res.status(500).send(err);
    }
    else
      res.send('OK');
  });
});

app.get('/firms', (req, res) => {
  Region.list(function(err, regions) {
    if( err ) {
      res.status(500).send(err);
    } else {
      res.render('firms', {regions: regions});
    }
  });
});

app.get('/firms/list', (req, res) => {
  Firm.list((err, rows) => {
    if( err ) {
      console.log(err);
      res.status(500).send(err);
    }

    res.send(rows);
  });
});

app.get('/firm/find', (req, res) => {
  var account_number = req.query.account_number;
  if( !account_number ) {
    res.status(404).send('Нет параметров');
    return;
  }

  Firm.find(account_number, (err, firm) => {
    if( err ) {
      console.log(err);
      res.status(500).send(err);
    } else if(!firm)
      res.status(404).send('Не найден');
    else 
      res.send(firm);
  });
});

app.post('/firms/insert', (req, res) => {
  var firm = {};
  firm.type = req.body.type;
  firm.name = req.body.name;
  firm.region_id = req.body.region_id;
  var cofounders = [];
  for( var i = 0; i < 5; i++ ) {
    var key_c = 'cofounders[' + i + '][card_id]';
    var key_s = 'cofounders[' + i + '][share]';
    if( req.body.hasOwnProperty(key_c) ) {
      cofounders.push({
        card_id: req.body[key_c],
        share: req.body[key_s]
      });
    }
  }
  Firm.insert(firm, (err, row) => {
    if( err ) {
      console.log(err);
      res.status(500).send(err);
    } else {
      Firm.insertCofounders(cofounders, row.id, (err, a) => {
        if( err ) {
          console.log(err);
          res.status(500).send(err);
        } else {
          res.send('OK');
        }
      });
    }
  });
});


app.post('/transaction/insert', (req, res) => {
  var tr = {};
  tr.sender = req.body.sender;
  tr.sender_type = req.body.sender_type;
  tr.receiver = req.body.receiver;
  tr.receiver_type = req.body.receiver_type;
  tr.receiver_sum = parseFloat(req.body.receiver_sum);
  tr.transaction_type = 0;
  tr.dt = new Date();

  Citizen.get(tr.sender, function(err, sender) {
    if( err )
      res.status(400).send('Не найден отправитель');
    else {
      Firm.get(tr.receiver, function(err, receiver) {
        if( err )
          res.status(400).send('Не найден получатель');
        else {
          Region.get(sender.region_id, function(err, senderRegion) {
            if( err )
              res.status(400).send('Не найден регион отправителя');
            else {
              Region.get(receiver.region_id, function( err, receiverRegion) {
                if( err )
                  res.status(400).send('Не найден регион получателя');
                else {
                  tr.sender_course = senderRegion.coef;
                  tr.receiver_course = receiverRegion.coef;
                  tr.base_sum = parseFloat((tr.receiver_sum / tr.receiver_course).toFixed(2));
                  tr.sender_sum = parseFloat((tr.base_sum * tr.sender_course).toFixed(2));
                  if( tr.base_sum > sender.account ) {
                    res.status(400).send('Не хватает денег на счёте');
                    return;
                  }

                  sender.account = parseFloat((sender.account - tr.base_sum).toFixed(2));
                  receiver.account = parseFloat((receiver.account + tr.base_sum).toFixed(2));

                  Transaction.insert(tr, function(err, id) {
                    if( err )
                      res.status(500).send('Не удалось провести транзакцию');
                    else {
                      Citizen.update(sender, function(err) {
                        if( !err )
                          Firm.updateForPension(receiver, tr.base_sum, function(err) {
                            if( !err )
                              res.send('OK');
                            else
                              res.status(500).send(err);
                          });
                        else
                          res.status(500).send(err);
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});

app.post('/transact/insert/prepare', (req, res) => {
  var tr = {};
  tr.sender = req.body.sender;
  tr.sender_type = req.body.sender_type;
  tr.receiver_type = req.body.receiver_type;
  tr.base_sum = parseFloat(req.body.sum);
  tr.transaction_type = req.body.transaction_type;
  tr.dt = new Date();
  var receivers = [];
  var key_id = req.body.receiver_type < 10 || req.body.receiver_type == 100 ? 'id' : 'card_id';
  for( var i = 0; i < req.body.receiver_count; i++ ) {
    var key = 'receivers[' + i + '][' + key_id + ']';
    if( req.body.hasOwnProperty(key) ) {
      receivers.push({
        id: req.body[key]
      });
    }
  }

  var transactions = [];
  for( var i = 0; i < receivers.length; i++ ) {
    var _tr = extend({}, tr);
    _tr.receiver = receivers[i].id;
    transactions.push(_tr);
  }

  var SenderType;
  if( tr.sender_type < 10 )
    SenderType = Firm;
  if( tr.sender_type == 10 )
    SenderType = Citizen;
  if( tr.sender_type == 100 )
    SenderType = Budget;

  var ReceiverType;
  if( tr.receiver_type < 10 )
    ReceiverType = Firm;
  if( tr.receiver_type == 10 )
    ReceiverType = Citizen;
  if( tr.receiver_type == 100 )
    ReceiverType = Budget;

  var notEnoughMoney = false;
  SenderType.get(tr.sender, function(err, _sender) {
    if( err )
      res.status(400).send('Невозможно найти получателя');
    else {
      if ( _sender.account < tr.base_sum * receivers.length ) {
        notEnoughMoney = true;
      }
      Region.get(_sender.region_id, function(err, _s_region) {
        for( var i = 0; i < transactions.length; i++ ) {
          transactions[i].sender_name = _sender.name;
          transactions[i].sender_course = _s_region.coef;
          transactions[i].sender_sum = parseFloat((tr.base_sum * _s_region.coef).toFixed(2));
        }

        async.map(transactions, function(tr, cb) {
          ReceiverType.get(tr.receiver, function(err, _receiver) {
            if( err ) return cb(err);
            else {
              tr.receiver_name = _receiver.name;
              Region.get(_receiver.region_id, function(err, _r_region) {
                tr.receiver_course = _r_region.coef;
                tr.receiver_sum = parseFloat((tr.base_sum * _r_region.coef).toFixed(2));
                return cb(null, tr); 
              });
            }
          });
        }, function(err, results) {
          if( err ) {
            console.log(err);
          }
          else  {
            var data = {};
            data.transactions = transactions;
            data.notEnoughMoney = notEnoughMoney;
            res.send(data);
          }
        });
      });
    }
  });
});

app.post('/transact/insert/many', (req, res) => {
  var transactions = [];

  var trans_count = req.body.count;
  if( trans_count < 1 )
    return res.send('OK');
  

  var fields = Transaction.fields;
  for( var i = 0; i < trans_count; i++ ) {
    transactions.push({});
    for( var j = 0; j < fields.length; j++ ) {
      var key = 'transactions[' + i + '][' + fields[j] + ']';
      if( req.body.hasOwnProperty(key) ) {
        transactions[i][fields[j]] = req.body[key];
      }
    }
  }
  async.mapSeries(transactions, function(tr, cb) {
    Transaction.insert(tr, function(err, id ) {
      if( err )
        return cb(err);
      else {
        var SenderType = null;
        if( tr.sender_type < 10 )
          SenderType = Firm;
        else if( tr.sender_type == 10 )
          SenderType = Citizen;
        else if( tr.sender_type == 100 )
          SenderType = Budget;

        var ReceiverType = null;
        if( tr.receiver_type < 10 )
          ReceiverType = Firm;
        else if( tr.receiver_type == 10 )
          ReceiverType = Citizen;
        else if( tr.receiver_type == 100 )
          ReceiverType = Budget;

        SenderType.get(tr.sender, function(err, _sender) {
          ReceiverType.get(tr.receiver, function(err, _receiver) {
            _sender.account = parseFloat((_sender.account - parseFloat(tr.base_sum)).toFixed(2));
            _receiver.account = parseFloat((_receiver.account + parseFloat(tr.base_sum)).toFixed(2));
            if( ReceiverType == Citizen && (tr.transaction_type == 1 || tr.transaction_type == 2) ) {
              _receiver.pension = parseFloat(_receiver.pension) + parseFloat(tr.base_sum);
            }

            SenderType.update(_sender, function(err) {
              if( !err )
                ReceiverType.update(_receiver, function(err) {
                  if( err )
                    return cb(err);
                  else
                    return cb(null, tr);
                });
              else
                return cb(err);
            });
          });
        });
      }
    });
  }, function(err, results) {
    if( err )
      res.status(500).send(err);
    else
      res.send('ok');
  });
});


app.get('/transactions', (req, res) => {
  res.render('transact');
});

app.get('/transact/list', (req, res) => {
  Transaction.list((err, rows) => {
    if( err ) {
      console.log(err);
      res.status(500).send(err);
    }

    res.send(rows);
  });
});

app.get('/transfer', (req, res) => {
  res.render('transfer');
});


app.get('/budget', (req, res) => {
  Budget.get(0, function(err, b) {
    if( err ) {
      console.log(err);
      res.status(500).send(err);
    }
    else
      res.render('budget', { money: b.account });
  });
});

app.get('/regions', (req, res) => {
  res.render('regions');
});

app.get('/regions/list', (req, res) => {
  Region.list(function(err, regions) {
    if( err ) {
      console.log(err);
      res.status(500).send(err);
    }
    else
      res.send(regions);
  });
});

app.post('/regions/insert', (req, res) => {
  Region.insert(req.body, (err) => {
    if( err ) {
      console.log(err)
      res.status(500).send(err);
    }
    else
      res.send('OK');
  });
});

app.post('/regions/update', (req, res) => {
  Region.update(req.body, (err) => {
    if( err ) {
      console.log(err)
      res.status(500).send(err);
    }
    else
      res.send('OK');
  });
});

app.get('/budget/ANPcount', (req, res) => {
  Transaction.ANPcount(function(err, rows) {
    if( err )
      res.status(500).send(err);
    else
      res.send(rows);
  });
});

app.get('/budget/PITcount', (req, res) => {
  Transaction.PITcount(function(err, rows) {
    if( err ) {
      console.log(err);
      res.status(500).send(err);
    }
    else
      res.send(rows);
  });
});


app.post('/budget/calccoef', (req, res) => {
  Region.list(function(err, regions) {
    if( err ) {
      res.status(500).send(err);
    } else {
      async.map(regions, function(reg, cb) {
        Transaction.selectNotCountedSum(reg.id, function(err, tr) {
          if( err ) return cb(err);
          else if( !tr ) 
            tr = {sum:0, region: reg.id}
          
          return cb(null, tr);
        });
      }, function(err, results) {
          if( err ) return res.status(500).send(err);

          var sum = results.reduce(function(p, cur) {
            return parseFloat(p) + parseFloat(cur.sum);
          }, 0);
          results = results.map(function(item) {
            item.coef = (item.sum / (sum / results.length)).toFixed(1);
            item.coef = parseFloat(item.coef);
            return item;
          });

          console.log(results);
          for( var i = 0; i < regions.length; i++ ) {
            for( var j = 0; j < results.length; j++ ) {
              if( results[j].region == regions[i].id )
                regions[i].coef = results[j].coef;
            }
          }
          console.log(regions);
          async.mapSeries(regions, function(region, cb) {
            Region.update(region, cb)
          }, function(err, results) {
            if( err ) return res.status(500).send(err);
            else return res.send('ok');
          });
        }
      );
    }
  });
});

app.listen(5000, () => {
  console.log('Web-server started on port 5000');
});
