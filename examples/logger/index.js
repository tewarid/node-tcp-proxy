var proxy = require("node-tcp-proxy");
var util = require("util");

var newProxy = proxy.createProxy(8080, "www.google.com", 80, {
    upstream: intercept,
    downstream: intercept
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
