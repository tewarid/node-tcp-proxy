var net = require("net");

function uniqueKey(socket) {
    var key = socket.remoteAddress + ":" + socket.remotePort;
    return key;
}

function TcpProxy(proxyPort, serviceHost, servicePort, options) {
    this.proxyPort = proxyPort;
    this.serviceHost = serviceHost;
    this.servicePort = servicePort;
	this.options = options;
    this.proxySockets = {};

    this.createProxy();
}

TcpProxy.prototype.createProxy = function() {
    this.log("proxy listening at port " + this.proxyPort);
    var proxy = this;

    proxy.server = net.createServer(function(proxySocket) {
        var key = uniqueKey(proxySocket);
        proxy.log("client connected from " + key);
        proxy.proxySockets[key] = proxySocket;

        var connected = false;
        var buffers = [];

        var serviceSocket = new net.Socket();
        serviceSocket.connect(proxy.servicePort,
        proxy.serviceHost, function() {
            connected = true;
            if (buffers.length > 0) {
                for (var i = 0; i < buffers.length; i++) {
                    serviceSocket.write(buffers[i]);
                }
            }
        });
        serviceSocket.on("data", function(data) {
            proxySocket.write(data);
        });
        serviceSocket.on("close", function(hadError) {
            proxy.log("service socket closed");
            proxy.log("  ending proxy socket");
            proxySocket.destroy();
        });
        serviceSocket.on("error", function(e) {
            proxy.log("service socket error");
            proxy.log(e);
            proxy.log("  ending proxy socket");
            proxySocket.destroy();
        });

        proxySocket.on("error", function(e) {
            proxy.log("proxy socket error");
            proxy.log(e);
        });
        proxySocket.on("data", function(data) {
            if (connected) {
                serviceSocket.write(data);
            } else {
                buffers[buffers.length] = data;
            }
        });
        proxySocket.on("close", function(hadError) {
            delete proxy.proxySockets[uniqueKey(proxySocket)];
            serviceSocket.destroy();
        });
    }).listen(proxy.proxyPort, proxy.options.hostname);
};

TcpProxy.prototype.end = function() {
    this.log("terminating proxy");
    this.server.close();
    for (var key in this.proxySockets) {
        this.proxySockets[key].destroy();
    }
    this.server.unref();
};

TcpProxy.prototype.log = function(msg) {
    if (!this.options || !this.options.quiet) {
        console.log(msg);
    }
};

module.exports.createProxy = function(proxyPort,
serviceHost, servicePort, options) {
    return new TcpProxy(proxyPort, serviceHost, servicePort, options);
};
