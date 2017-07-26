var WebSocketServer = require('websocket').server;

const { exec } = require('child_process');

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
    exec('cd &&  ./a.out', (err, stdout, stderr) => {
      if (err) {
        // node couldn't execute the command
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      
      var msg = JSON.parse(message.utf8Data);
      msg.text = stdout;
      connection.sendUTF(JSON.stringify(msg));
    });
  });

  connection.on('close', function(connection) {
    // close user connection
  });
});
