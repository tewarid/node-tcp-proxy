var net = require("net");
var tls = require('tls');
var fs = require('fs');
var util = require('util');

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
    this.options = this.parseOptions(options);
    this.proxyTlsOptions = {
        passphrase: this.options.passphrase,
        secureProtocol: "TLSv1_2_method"
    };
    if (this.options.tls) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        this.proxyTlsOptions.pfx = fs.readFileSync(this.options.pfx);
    }
    this.serviceTlsOptions = {
        rejectUnauthorized: this.options.rejectUnauthorized,
        secureProtocol: "TLSv1_2_method"
    };
    this.proxySockets = {};
    if (this.options.identUsers.length !== 0) {
        this.users = this.options.identUsers;
        this.log('Will only allow these users: '.concat(this.users.join(', ')));
    } else {
        this.log('Will allow all users');
    }
    if (this.options.allowedIPs.length !== 0) {
        this.allowedIPs = this.options.allowedIPs;
    }
    this.createListener();
}

TcpProxy.prototype.parseOptions = function(options) {
    return Object.assign({
        quiet: true,
        pfx: require.resolve('./cert.pfx'),
        passphrase: 'abcd',
        rejectUnauthorized: true,
        identUsers: [],
        allowedIPs: []
    }, options);
};

TcpProxy.prototype.createListener = function() {
    var self = this;
    if (self.options.tls) {
        self.server = tls.createServer(self.options.customTlsOptions || self.proxyTlsOptions, function(socket) {
            self.handleClientConnection(socket);
        });
    } else {
        self.server = net.createServer(function(socket) {
            self.handleClientConnection(socket);
        });
    }
    self.server.listen(self.proxyPort, self.options.hostname);
};

TcpProxy.prototype.handleClientConnection = function(socket) {
    var self = this;
    if (self.users) {
        self.handleAuth(socket);
    } else {
        self.handleClient(socket);
    }
};

// RFC 1413 authentication
TcpProxy.prototype.handleAuth = function(proxySocket) {
    var self = this;
    if (self.allowedIPs.includes(proxySocket.remoteAddress)) {
        self.handleClient(proxySocket);
        return;
    }
    var query = util.format("%d, %d", proxySocket.remotePort, this.proxyPort);
    var ident = new net.Socket();
    var resp = undefined;
    ident.on('error', function(e) {
        resp = false;
        ident.destroy();
    });
    ident.on('data', function(data) {
        resp = data.toString().trim();
        ident.destroy();
    });
    ident.on('close', function(data) {
        if (!resp) {
            self.log('No identd');
            proxySocket.destroy();
            return;
        }
        var user = resp.split(':').pop();
        if (!self.users.includes(user)) {
            self.log(util.format('User "%s" unauthorized', user));
            proxySocket.destroy();
        } else {
            self.handleClient(proxySocket);
        }
    });
    ident.connect(113, proxySocket.remoteAddress, function() {
        ident.write(query);
        ident.end();
    });
};

TcpProxy.prototype.handleClient = function(proxySocket) {
    var self = this;
    var key = uniqueKey(proxySocket);
    self.proxySockets[`${key}`] = proxySocket;
    var context = {
        buffers: [],
        connected: false,
        proxySocket: proxySocket
    };
    proxySocket.on("data", function(data) {
        self.handleUpstreamData(context, data);
    });
    proxySocket.on("close", function(hadError) {
        delete self.proxySockets[uniqueKey(proxySocket)];
        if (context.serviceSocket !== undefined) {
            context.serviceSocket.destroy();
        }
    });
    proxySocket.on("error", function(e) {
        if (context.serviceSocket !== undefined) {
            context.serviceSocket.destroy();
        }
    });
};

TcpProxy.prototype.handleUpstreamData = function(context, data) {
    var self = this;
    Promise.resolve(self.intercept(self.options.upstream, context, data))
        .then((processedData) => {
            if (context.connected) {
                context.serviceSocket.write(processedData);
            } else {
                context.buffers[context.buffers.length] = processedData;
                if (context.serviceSocket === undefined) {
                    self.createServiceSocket(context);
                }
            }
        });
};

TcpProxy.prototype.createServiceSocket = function(context) {
    var self = this;
    var options = self.parseServiceOptions(context);
    if (self.options.tls === "both") {
        context.serviceSocket = tls.connect(options, function() {
            self.writeBuffer(context);
        });
    } else {
        context.serviceSocket = new net.Socket();
        context.serviceSocket.connect(options, function() {
            self.writeBuffer(context);
        });
    }
    context.serviceSocket.on("data", function(data) {
        Promise.resolve(self.intercept(self.options.downstream, context, data))
            .then((processedData) => context.proxySocket.write(processedData));
    });
    context.serviceSocket.on("close", function(hadError) {
        if (context.proxySocket !== undefined) {
            context.proxySocket.destroy();
        }
    });
    context.serviceSocket.on("error", function(e) {
        if (context.proxySocket !== undefined) {
            context.proxySocket.destroy();
        }
    });
};

TcpProxy.prototype.parseServiceOptions = function(context) {
    var self = this;
    var i = self.getServiceHostIndex(context.proxySocket);
    return Object.assign({
        port: self.servicePorts[parseInt(i, 10)],
        host: self.serviceHosts[parseInt(i, 10)],
        localAddress: self.options.localAddress,
        localPort: self.options.localPort
    }, self.serviceTlsOptions);
};

TcpProxy.prototype.getServiceHostIndex = function(proxySocket) {
    this.serviceHostIndex++;
    if (this.serviceHostIndex == this.serviceHosts.length) {
        this.serviceHostIndex = 0;
    }
    var index = this.serviceHostIndex;
    if (this.options.serviceHostSelected) {
        index = this.options.serviceHostSelected(proxySocket, index);
    }
    return index;
};

TcpProxy.prototype.writeBuffer = function(context) {
    context.connected = true;
    if (context.buffers.length > 0) {
        for (var i = 0; i < context.buffers.length; i++) {
            context.serviceSocket.write(context.buffers[parseInt(i, 10)]);
        }
    }
};

TcpProxy.prototype.end = function() {
    this.server.close();
    for (var key in this.proxySockets) {
        this.proxySockets[`${key}`].destroy();
    }
    this.server.unref();
};

TcpProxy.prototype.log = function(msg) {
    if (!this.options.quiet) {
        console.log(msg);
    }
};

TcpProxy.prototype.intercept = function(interceptor, context, data) {
    if (interceptor) {
        return interceptor(context, data);
    }
    return data;
};
