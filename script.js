#!/usr/bin/env node
var proxy = require("./tcpProxy.js");
 
var argv = require("optimist")
    .usage('Usage: $0 --proxyPort [port] --serviceHost [host] --servicePort [port]')
    .demand(['proxyPort', 'serviceHost', 'servicePort'])
    .argv;

var newProxy = proxy.createProxy(argv.proxyPort, argv.serviceHost, argv.servicePort);

process.on("uncaughtException", function (err) {
    console.info(err);
});

process.on("SIGINT", function() {
    newProxy.end();
});
