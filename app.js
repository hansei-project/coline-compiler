var WebSocketServer = require('websocket').server;

const { exec } = require('child_process');

var fs = require('fs');

var http = require('http');

var express = require('express');
var app = express();
var router = require('./router/main')(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

var server = app.listen(3000, function(){
    console.log("Express server has started on port 3000")
});

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
    //compile source and execute output program
    exec(`docker run asdf/compiler:CHs /bin/bash -c "echo "${msg.source}" > a.${extention}; `
        + `${command} a.${extention} -o a.out; ` + `./a.out`, (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        msg.source = stderr;
        connection.sendUTF(JSON.stringify(msg));
        return;
      }
      msg.source = stdout;
      connection.sendUTF(JSON.stringify(msg));
    });
    exec(` docker rm $(docker ps --filter 'status=exited' -a -q)`, (err,stdout,stderr) => {});
  });

  connection.on('close', function(connection) {
    // close user connection
  });
});
