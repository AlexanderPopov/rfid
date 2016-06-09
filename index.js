const events = require('events');
const ee = new events.EventEmitter();
const http = require('http');

const sp = require( 'serialport' );

var scanner;

ee.on('found_scanner', (portName) => {
  scanner = new sp.SerialPort( portName, {
    baudRate: 9600
  , parser: sp.parsers.readline('\n')
  });

  scanner.on('open', () => {
    console.log('Scanner is ready');
  });

  scanner.on('data', (data) => {
    console.log(data);
  });
});

sp.list((err, ports) => {
  if( err ) 
    console.log( 'Error: ', err );
  else if( ports ) {
    ports.forEach((port) => {
      if( port.manufacturer === '1a86' ) {
        ee.emit('found_scanner', port.comName);
      }
    });
  }
  else {
    console.log( 'No ports ¯\\_(ツ)_/¯ ' );
  }
});

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Server is running');
});
