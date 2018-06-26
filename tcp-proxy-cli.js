#!/usr/bin/env node

var argv = require("commander");

argv
    .usage("Usage: $0 --proxyPort [port] [--hostname [IP]]  --serviceHost [host] --servicePort [port] [--q]")
    .usage("[options]")
    .version("0.0.9")
    .option("-p, --proxyPort <number>", "Proxy port number", parseInt)
    .option("-h, --hostname [name]", "Name or IP address of host")
    .option("-n, --serviceHost <name>", "Name or IP address of service host")
    .option("-s, --servicePort <number>", "Service port number", parseInt)
    .option("-q, --q", "Be quiet")
    .parse(process.argv);
console.log(argv);
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
