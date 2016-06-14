const express = require('express');
const exphbs = require('express-handlebars');
var app = express();

const bodyParser = require('body-parser')

var Region = require('./models/region');
var Citizen = require('./models/citizen');
var Firm = require('./models/firm');


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
      res.render('people', {layout: 'main', regions: regions});
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


app.listen(5000, () => {
  console.log('Web-server started on port 5000');
});
