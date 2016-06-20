const events = require('events');
const ee = new events.EventEmitter();
const http = require('http');
const ws = require('websocket').server;

const sp = require( 'serialport' );

var scanner = null;
ee.on('to_scanner', (message) => {
  console.log('To scanner: ', message);
  if( scanner )
    scanner.write(message);
});

ee.on('found_scanner', (portName) => {
  scanner = new sp.SerialPort( portName, {
    baudRate: 9600
  , parser: sp.parsers.readline('\n')
  });

  scanner.on('open', () => {
    console.log('Scanner is ready');
    ee.emit('scanner_ready', scanner);
  });

  scanner.on('data', (data) => {
    console.log('From scanner: ', data);
    if( data == 51 ) {
      console.log('pong');
      scanner.write('53');
    } else
      ee.emit('scanner_data', data);
  });

  scanner.on('error', (error) => {
    console.log('Error: ', error);
  });

  scanner.on('close', () => {
    ee.emit('scanner_off');
    scanner = null;
    console.log('Port closed');
  });
});

function findScanner() {
  sp.list((err, ports) => {
    if( err ) 
      console.log( 'Error: ', err );
    else if( ports ) {
      ports.forEach((port) => {
        if( port.manufacturer === '1a86' || port.manufacturer === 'wch.cn' ) {
          ee.emit('found_scanner', port.comName);
        }
      });
    }
    else {
      console.log( 'No ports ¯\\_(ツ)_/¯ ' );
    }
  });
}

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('SSG BANK SCANNER SERVER\n');
});

server.listen(3000, '127.0.0.1', () => {
  findScanner();
  console.log('Scanner server is running');
});


wsServer = new ws({
  httpServer: server,
  autoAcceptConnections: false
});

wsServer.on('request', (request) => {
  if( scanner === null ) {
    findScanner();
  }

  var connection = request.accept('scanner', request.origin);

  if( scanner )
    connection.sendUTF('scanner_on:' + scanner.path);

  ee.on('scanner_data', (scanner_data) => {
    connection.sendUTF(scanner_data);
  });
  ee.on('scanner_off', () => {
    connection.sendUTF('scanner_off');
  });
  ee.on('scanner_ready', (scanner) => {
    connection.sendUTF('scanner_on:' + scanner.path);
  });
  connection.on('message', (message) => {
    console.log('message from client');
    ee.emit('to_scanner', message.utf8Data);
  });
  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});
