#!/usr/bin/env node
var argv = require("commander");
var packageConfig = require('./package.json');

argv
    .usage("[options]")
    .version(packageConfig.version)
    .option("-p, --proxyPort <number>", "Proxy port number", parseInt)
    .option("-h, --hostname [name]", "Name or IP address of host")
    .option("-n, --serviceHost <name>", "Name or IP address of service host")
    .option("-s, --servicePort <number>", "Service port number", parseInt)
    .option("-q, --q", "Be quiet")
    .option("-t, --tls [both]", "Use TLS", false)
    .option("-c, --pfx [file]", "Private key file",
        require.resolve("./cert.pfx"))
    .option("-a, --passphrase [value]",
        "Passphrase to access private key file", "abcd")
    .parse(process.argv);

var options = {
    hostname: argv.hostname,
	quiet: argv.q,
	tls: argv.tls,
    pfx: argv.pfx,
    passphrase: argv.passphrase
};

const proxy = require("./tcp-proxy.js")
    .createProxy(argv.proxyPort, argv.serviceHost,
        argv.servicePort, options);

process.on("uncaughtException", function(err) {

});

process.on("SIGINT", function() {
    proxy.end();
});
