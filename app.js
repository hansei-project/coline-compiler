var WebSocketServer = require('websocket').server;

var exec = require('child-process-promise').exec;

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
    var containerName = `vm${(new Date()).getSeconds()}_${(new Date()).getMilliseconds()}`;
    fs.writeFileSync(`'/home/pi/${containerName}.${extention}`, msg.source);
    //compile source and execute output program
    exec(`docker run -dt --name ${containerName} asdf/compiler:CHs /bin/bash`)
      .then((result) => {
        return exec(`docker cp /home/pi/a.${extention} ${containerName}:/root/`);
      })
      .then((result) => {
        return exec(`docker exec gcc /root/${containerName}.${extention} -o /root/a.out`);
      })
      .then((result) => {
        var stderr = result.stderr;
        if (stderr)
          connection.sendUTF(stderr);
        else
          exec(`docker exec ./root/a.out`)
            .then((result) => connection.sendUTF(result.stdout));
      });

  });

  connection.on('close', function(connection) {
    // close user connection
  });
});
