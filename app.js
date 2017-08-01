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

var server = app.listen(4000, function(){
    console.log("Express server has started on port 4000")
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
    fs.writeFileSync(`/home/pi/${containerName}.${extention}`, msg.source);
    //compile source and execute output program
    exec(`docker run -dt --name ${containerName} asdf/compiler:CHs /bin/bash`)
      .then((result) => {
        console.log('make source...');
        return exec(`docker cp /home/pi/${containerName}.${extention} ${containerName}:/root/`);
      })
      .then((result) => {
        console.log('compile...');
        return exec(`docker exec ${containerName} gcc /root/${containerName}.${extention} -o /root/a.out`);
      })
      .then((result) => {
        var stderr = result.stderr;
	if (stderr != "") {
          console.log('Error!');
          connection.sendUTF(stderr);
        }
        else {
          console.log('executing...')
          return exec(`docker exec ${containerName} ./root/a.out`)
            .then((result) => {
              console.log(result.stdout);
              connection.sendUTF(result.stdout);
            });
        }
      })
      .then((result) => {
        console.log('finish!');
        exec(`docker stop ${containerName}; docker rm ${containerName}`);
      });

  });

  connection.on('close', function(connection) {
    // close user connection
  });
});
