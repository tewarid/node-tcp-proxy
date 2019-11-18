var net = require("net");
var tls = require('tls');
var fs = require('fs');

module.exports.createProxy = function(proxyPort,
    serviceHost, servicePort, options) {
    return new TcpProxy(proxyPort, serviceHost, servicePort, options);
};

function uniqueKey(socket) {
    var key = socket.remoteAddress + ":" + socket.remotePort;
    return key;
}

function parse(o) {
    if (typeof o === "string") {
        return o.split(",");
    } else if (typeof o === "number") {
        return parse(o.toString());
    } else if (Array.isArray(o)) {
        return o;
    } else {
        throw new Error("cannot parse object: " + o);
    }
}

function TcpProxy(proxyPort, serviceHost, servicePort, options) {
    this.proxyPort = proxyPort;
    this.serviceHosts = parse(serviceHost);
    this.servicePorts = parse(servicePort);
    this.serviceHostIndex = -1;
    this.options = Object.assign({
        quiet: false,
        pfx: require.resolve('./cert.pfx'),
        passphrase: 'abcd',
        rejectUnauthorized: true
    }, options);

    this.proxyTlsOptions = {
        passphrase: this.options.passphrase,
        secureProtocol: "TLSv1_2_method"
    };
    if (this.options.tls) {
        this.proxyTlsOptions.pfx = fs.readFileSync(this.options.pfx);
    }
    this.serviceTlsOptions = {
        rejectUnauthorized: this.options.rejectUnauthorized,
        secureProtocol: "TLSv1_2_method"
    };
    this.proxySockets = {};

    this.createListener();
}

TcpProxy.prototype.createListener = function() {
    var self = this;
    if (self.options.tls) {
        self.server = tls.createServer(self.proxyTlsOptions, function(socket) {
            self.handleClient(socket);
        });
    } else {
        self.server = net.createServer(function(socket) {
            self.handleClient(socket);
        });
    }
    self.server.listen(self.proxyPort, self.options.hostname);
};

TcpProxy.prototype.handleClient = function(proxySocket) {
    var self = this;
    var key = uniqueKey(proxySocket);
    self.proxySockets[key] = proxySocket;
    var context = {
        buffers: [],
        connected: false,
        proxySocket: proxySocket
    };
    self.createServiceSocket(context);
    proxySocket.on("data", function(data) {
        if (context.connected) {
            context.serviceSocket.write(data);
        } else {
            context.buffers[context.buffers.length] = data;
        }
    });
    proxySocket.on("close", function(hadError) {
        delete self.proxySockets[uniqueKey(proxySocket)];
        context.serviceSocket.destroy();
    });
    proxySocket.on("error", function(e) {
        context.serviceSocket.destroy();
    });
};

TcpProxy.prototype.createServiceSocket = function(context) {
    var self = this;
    var i = self.getServiceHostIndex();
    if (self.options.tls === "both") {
        context.serviceSocket = tls.connect(self.servicePorts[i],
            self.serviceHosts[i], self.serviceTlsOptions, function() {
                self.writeBuffer(context);
            });
    } else {
        context.serviceSocket = new net.Socket();
        context.serviceSocket.connect(self.servicePorts[i],
            self.serviceHosts[i], function() {
                self.writeBuffer(context);
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

TcpProxy.prototype.getServiceHostIndex = function() {
    this.serviceHostIndex++;
    if (this.serviceHostIndex == this.serviceHosts.length) {
        this.serviceHostIndex = 0;
    }
    return this.serviceHostIndex;
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
