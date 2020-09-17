var proxy = require("node-tcp-proxy");
var util = require("util");

var newProxy = proxy.createProxy(8080, "www.google.com", 443, {
    upstream: function(context, data) {
        console.log(util.format("%s:%s sent:",
            context.proxySocket.remoteAddress,
            context.proxySocket.remotePort));
        console.log(data);
        return data;
    },
    downstream: function(context, data) {
        console.log(util.format("%s:%s sent:",
            context.serviceSocket.remoteAddress,
            context.serviceSocket.remotePort));
        console.log(data);
        return data;
    }
});

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
