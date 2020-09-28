var proxy = require("node-tcp-proxy");
var util = require("util");

var serviceHosts = ["www.google.com", "www.bing.com"];
var servicePorts = [80, 80];

var newProxy = proxy.createProxy(8080, serviceHosts, servicePorts, {
    upstream: intercept,
    downstream: intercept,
    serviceHostSelected: function(proxySocket, i) {
        console.log(util.format("Service host %s:%s selected for client %s:%s.",
            serviceHosts[i],
            servicePorts[i],
            proxySocket.remoteAddress,
            proxySocket.remotePort));
        // use your own strategy to calculate i
        return i;
    }
});

function intercept(context, data) {
    console.log(util.format("%s:%s sent:",
        context.proxySocket.remoteAddress,
        context.proxySocket.remotePort));
    console.log(data);
    return data;
}

console.log("Open http://localhost:8080 in the browser.");

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
