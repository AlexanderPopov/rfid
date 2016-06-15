const express = require('express');
const exphbs = require('express-handlebars');
var app = express();

const bodyParser = require('body-parser')

var Region = require('./models/region');
var Citizen = require('./models/citizen');
var Firm = require('./models/firm');
var Transaction = require('./models/transaction');


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
	// !base_sum real not null,
	// !sender_sum real not null,
	// receiver_sum real not null,
	// !sender_course real not null,
	// !receiver_course read not null,
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
                          Firm.update(receiver, function(err) {
                            if( !err )
                              res.send('OK');
                          });
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


app.listen(5000, () => {
  console.log('Web-server started on port 5000');
});
