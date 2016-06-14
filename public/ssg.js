ssg = {};

ssg.STATUS = {
  IDLE:        0,
  CARDREQUEST: 1,
  ERROR:       2
};

ssg.getCardCallback = null;

ssg.connectToScanner = function() {
  ssg.scanner = new WebSocket('ws://localhost:3000', 'scanner');
  ssg.scanner.onopen = function() {
    console.log('Установлено соединение со сканером');
  };
  ssg.scanner.onmessage = function(message) {
    ssg.parseScannerMessage(message.data);
  };
  ssg.scanner.onclose = function(event) {
    if( event.wasClean )
      console.log('Закрыто соединение со сканером.');
    else
      console.log('Обрыв соединения со сканером.');
    console.log('Код: ' + event.code + '. Причина: ' + event.reason);
    ssg.scanner = null;
    ssg.scannerOff();
  };
  ssg.scanner.onerror = function(error) {
    console.log(error);
  }
};

ssg.scannerOn = function(port) {
  $('.scanner-on').show().find('.scanner-port').text(port);
  $('.scanner-off').hide();
  $('.scanner-status').addClass('glyphicon-ok');
  $('.scanner-status').removeClass('glyphicon-remove');
};

ssg.scannerOff = function() {
  $('.scanner-on').hide();
  $('.scanner-off').show();
  $('.scanner-status').removeClass('glyphicon-ok');
  $('.scanner-status').addClass('glyphicon-remove');
};

ssg.parseScannerMessage = function(message) {
  var params = message.split(':');

  if( !params || params.length < 1 )
    return;

  switch ( params[0] ) {
    case 'scanner_on':
      ssg.scannerOn(params[1]);
      break;
    case 'scanner_off':
      ssg.scannerOff();
      break;
    case 'card_id':
      if( ssg.getCardCallback !== null ) {
        ssg.getCardCallback(params[1]);
        ssg.getCardCallback = null;
      }
      break;
    default:
      console.log(message);
  }
};

ssg.cardRequest = function(cb) {
  if( ssg.scanner ) {
    ssg.getCardCallback = cb;
    ssg.scanner.send(ssg.STATUS.CARDREQUEST);
  } else {
    alert('Сканер не доступен. Перезагрузите страницу');
  }
};

ssg.showErrorOnScanner = function() {
  if( ssg.scanner )
    ssg.scanner.send(ssg.STATUS.ERROR);
};
