var net = require("net");
var tls = require('tls');
var fs = require('fs');

function uniqueKey(socket) {
    var key = socket.remoteAddress + ":" + socket.remotePort;
    return key;
}

function TcpProxy(proxyPort, serviceHost, servicePort, options) {
    this.proxyPort = proxyPort;
    this.serviceHost = serviceHost;
    this.servicePort = servicePort;
    if (options === undefined) {
        this.options = {
            quiet: false
        };
    } else {
        this.options = options;
    }
    this.proxySockets = {};

    this.createProxy();
}

TcpProxy.prototype.createProxy = function() {
    const proxy = this;
    if (proxy.options.tls !== false) {
        var tlsOptions = {
            pfx: fs.readFileSync(proxy.options.pfx),
            passphrase: proxy.options.passphrase
        };
        proxy.server = tls.createServer(tlsOptions, function(socket) {
            proxy.handleClient(socket);
        });
    } else {
        proxy.server = net.createServer(function(socket) {
            proxy.handleClient(socket);
        });
    }
    proxy.server.listen(proxy.proxyPort, proxy.options.hostname);
};

TcpProxy.prototype.handleClient = function(proxySocket) {
    const proxy = this;
    var key = uniqueKey(proxySocket);
    proxy.proxySockets[key] = proxySocket;
    var context = {
        buffers: [],
        connected: false,
        proxySocket: proxySocket
    };
    proxy.createServiceSocket(context);
    proxySocket.on("data", function(data) {
        if (context.connected) {
            context.serviceSocket.write(data);
        } else {
            context.buffers[context.buffers.length] = data;
        }
    });
    proxySocket.on("close", function(hadError) {
        delete proxy.proxySockets[uniqueKey(proxySocket)];
        context.serviceSocket.destroy();
    });
};

TcpProxy.prototype.createServiceSocket = function(context) {
    const proxy = this;
    if (proxy.options.tls === "both") {
        context.serviceSocket =
        tls.connect(proxy.servicePort, proxy.serviceHost, {
            rejectUnauthorized: proxy.options.rejectUnauthorized
        }, function() {
            proxy.writeBuffer(context);
        });
    } else {
        context.serviceSocket = new net.Socket();
        context.serviceSocket.connect(proxy.servicePort, proxy.serviceHost,
        function() {
            proxy.writeBuffer(context);
        });
    }
    context.serviceSocket.on("data", function(data) {
        context.proxySocket.write(data);
    });
    context.serviceSocket.on("close", function(hadError) {
        context.proxySocket.destroy();
    });
    context.serviceSocket.on("error", function(e) {
        context.proxySocket.destroy();
    });
};

TcpProxy.prototype.writeBuffer = function(context) {
    context.connected = true;
    if (context.buffers.length > 0) {
        for (var i = 0; i < context.buffers.length; i++) {
            context.serviceSocket.write(context.buffers[i]);
        }
    }
};

TcpProxy.prototype.end = function() {
    this.server.close();
    for (var key in this.proxySockets) {
        this.proxySockets[key].destroy();
    }
    this.server.unref();
};

TcpProxy.prototype.log = function(msg) {
    if (!this.options.quiet) {
        console.log(msg);
    }
};

module.exports.createProxy = function(proxyPort,
serviceHost, servicePort, options) {
    return new TcpProxy(proxyPort, serviceHost, servicePort, options);
};
