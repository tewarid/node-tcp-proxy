var net = require("net");

function uniqueKey(socket) {
    var key = socket.remoteAddress + ':' + socket.remotePort;
    return key;
}

function Proxy(proxyPort, serviceHost, servicePort) {
    this.proxyPort = proxyPort;
    this.serviceHost = serviceHost;
    this.servicePort = servicePort;
    this.proxySockets = {};

    this.createProxy();
    console.log("Proxy listening at port " + this.proxyPort);
}

Proxy.prototype.createProxy = function () {
    var proxy = this;

    proxy.server = net.createServer(function (proxySocket) {
        
        var key = uniqueKey(proxySocket);
        console.log("Client connected from " + key);
        proxy.proxySockets[key] = proxySocket;
        
        var connected = false;
        var buffers = new Array();

        var serviceSocket = new net.Socket();
        serviceSocket.connect(proxy.servicePort, proxy.serviceHost, function () {
            connected = true;
            if (buffers.length > 0) {
                for (var i = 0; i < buffers.length; i++) {
                    serviceSocket.write(buffers[i]);
                }
            }
        });

        proxySocket.on("error", function (e) {
            serviceSocket.end();
        });
        serviceSocket.on("error", function (e) {
            console.log("Could not connect to service at host "
                + proxy.serviceHost + ', port ' + proxy.servicePort);
            proxySocket.end();
        });
        
        proxySocket.on("data", function (data) {
            if (connected) {
                serviceSocket.write(data);
            } else {
                buffers[buffers.length] = data;
            }
        });
        serviceSocket.on("data", function (data) {
            proxySocket.write(data);
        });

        proxySocket.on("close", function (had_error) {
            delete proxy.proxySockets[uniqueKey(proxySocket)];
            serviceSocket.end();
        });
        serviceSocket.on("close", function (had_error) {
            proxySocket.end();
        });

    }).listen(proxy.proxyPort)
}

Proxy.prototype.end = function () {
    console.log("Terminating proxy");
    this.server.close();
    for (var key in this.proxySockets) {
        this.proxySockets[key].end();
    }
}

exports.createProxy = function(proxyPort, serviceHost, servicePort) {    
    return new Proxy(proxyPort, serviceHost, servicePort);
}
