var util = require('util');
var net = require("net");
 
process.on("uncaughtException", function(e) {
    console.log(e);
});

var argv = require("optimist")
  .usage('Usage: $0 --proxyPort [port] --serviceHost [host] --servicePort [port]')
  .demand(['proxyPort', 'serviceHost', 'servicePort'])
  .argv;
 
net.createServer(function (proxySocket) {
  var connected = false;
  var buffers = new Array();
  var serviceSocket = new net.Socket();
  serviceSocket.connect(parseInt(argv.servicePort), argv.serviceHost, function() {
    connected = true;
    if (buffers.length > 0) {
      for (var i = 0; i < buffers.length; i++) {
        //console.log(buffers[i]);
        serviceSocket.write(buffers[i]);
      }
    }
  });
  proxySocket.on("error", function (e) {
    serviceSocket.end();
  });
  serviceSocket.on("error", function (e) {
    console.log("Could not connect to service at host "
      + argv.serviceHost + ', port ' + argv.servicePort);
    proxySocket.end();
  });
  proxySocket.on("data", function (data) {
    if (connected) {
      serviceSocket.write(data);
    } else {
      buffers[buffers.length] = data;
    }
  });
  serviceSocket.on("data", function(data) {
    proxySocket.write(data);
  });
  proxySocket.on("close", function(had_error) {
    serviceSocket.end();
  });
  serviceSocket.on("close", function(had_error) {
    proxySocket.end();
  });
}).listen(argv.proxyPort)
