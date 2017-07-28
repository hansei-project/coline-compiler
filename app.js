var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var WebSocketServer = require('websocket').server;

const { exec } = require('child_process');

var fs = require('fs');

var http = require('http');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;


var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(8080, function() { });

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);

  //connection event handler
  connection.on('message', function(message) {
    var msg = JSON.parse(message.utf8Data);
    var lang = msg.language;
    var command = null;
    var extention = null;
    if (lang == 'C') {
      command = 'gcc';
      extention = 'c';
    }
    else if (lang == 'Haskell'){
      command = 'ghc';
      extention = 'hs';
    }
    fs.writeFile('/home/pi/aaa.' + extention, msg.source, (err) => {if (err) console.log(err) } );
    //compile source and execute output program
    exec('cd && ' + command + ' aaa.' + extention + ' -o a.out', (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        msg.source = stderr;
        connection.sendUTF(JSON.stringify(msg));
        return;
      }
      exec('cd &&  ./a.out', (err, stdout, stderr) => {
        if (err) {
          console.log(err);
          return;
        }
        msg.source = stdout;
        connection.sendUTF(JSON.stringify(msg));
      });
    });
  });

  connection.on('close', function(connection) {
    // close user connection
  });
});
