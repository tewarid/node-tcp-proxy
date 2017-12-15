#!/usr/bin/env node

var argv = require("optimist")
    .usage("Usage: $0 --proxyPort [port] [--hostname [IP]]"
    + " --serviceHost [host] --servicePort [port] [--q]")
    .demand(["proxyPort", "serviceHost", "servicePort"])
	.boolean("q")
    .argv;

var options = {
    hostname: argv.hostname,
	quiet: argv.q
};

const proxy = require("./tcp-proxy.js")
    .createProxy(argv.proxyPort, argv.serviceHost,
        argv.servicePort, options);

process.on("uncaughtException", function(err) {

});

process.on("SIGINT", function() {
    proxy.end();
});
