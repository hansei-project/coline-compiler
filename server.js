var WebSocketServer = require('websocket').server;

const { exec } = require('child_process');

var fs = require('fs');

var http = require('http');

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

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    var msg = JSON.parse(message.utf8Data);
    fs.writeFile('/home/ten/aaa.c', msg.text, (err) => {if (err) console.log(err) } );
    
    exec('cd && gcc aaa.c', (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        msg.source = stdout;
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
