var proxy = require("node-tcp-proxy");
var util = require("util");
var replace = require('buffer-replace');
var argv = require("commander");

argv
    .usage("[options]")
    .option("--tls", "Use TLS 1.2; ", false)
    .parse(process.argv);

var PROXY_HOST = "localhost";
var PROXY_PORT = "8080";
var SERVICE_HOST = "www.baidu.com";
var SERVICE_PORT = argv.tls ? 443: 80;

var serviceHosts = [SERVICE_HOST, SERVICE_HOST];
var servicePorts = [SERVICE_PORT, SERVICE_PORT];

var options = {
    upstream: function(context, data) {
        log(context.proxySocket, data);
        data = replace(data, `${PROXY_HOST}:${PROXY_PORT}`, SERVICE_HOST);
        return data;
    },
    downstream: function(context, data) {
        log(context.serviceSocket, data);
        data = replace(data, SERVICE_HOST, `${PROXY_HOST}:${PROXY_PORT}`);
        return data;
    },
    serviceHostSelected: function(proxySocket, i) {
        console.log(util.format("Service host %s:%s selected for client %s:%s.",
            serviceHosts[parseInt(i, 10)],
            servicePorts[parseInt(i, 10)],
            proxySocket.remoteAddress,
            proxySocket.remotePort));
        // use your own strategy to calculate i
        return i;
    }
};

if (argv.tls) {
    options.tls = "both";
}

var newProxy = proxy
    .createProxy(PROXY_PORT, serviceHosts, servicePorts, options);

function log(socket, data) {
    console.log(util.format("%s:%s sent:",
        socket.remoteAddress,
        socket.remotePort));
    console.log(data.toString('hex'));
}

console.log("Open http://localhost:8080 in the browser.");

if (argv.tls) {
    console.log("TLS 1.2 is enabled.");
} else {
    console.log("Specify --tls in command line if you want to use TLS 1.2.");
}

console.log("press Enter key to quit...");
setTimeout(handleTimeout, 1000);
function handleTimeout() {
    var data = process.stdin.read(1);
    if (data) {
        console.log("bye.");
        newProxy.end();
        process.exit(0);
    }
    setTimeout(handleTimeout, 1000);
}
