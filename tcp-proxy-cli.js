#!/usr/bin/env node
var argv = require("commander");
var packageConfig = require('./package.json');

argv
    .usage("[options]")
    .version(packageConfig.version)
    .option("-p, --proxyPort <number>",
        "Proxy port number (required)", parseInt)
    .option("-h, --hostname [name]", "Name or IP address of host")
    .option("-n, --serviceHost <name>",
        "Name or IP address of service host(s); " +
        "if this is a comma separated list, " +
        "performs round-robin load balancing (required)")
    .option("-s, --servicePort <number>", "Service port number(s); " +
        "if this a comma separated list," +
        "it should have as many entries as serviceHost (required)")
    .option("-q, --q", "Be quiet")
    .option("-t, --tls [both]", "Use TLS 1.2 with clients; " +
        "specify both to also use TLS 1.2 with service", false)
    .option("-u, --rejectUnauthorized [value]",
        "Do not accept invalid certificate", false)
    .option("-c, --pfx [file]", "Private key file",
        require.resolve("./cert.pfx"))
    .option("-a, --passphrase [value]",
        "Passphrase to access private key file", "abcd")
    .parse(process.argv);

var options = {
    hostname: argv.hostname,
    quiet: argv.q,
    tls: argv.tls,
    rejectUnauthorized: argv.rejectUnauthorized !== "false",
    pfx: argv.pfx,
    passphrase: argv.passphrase
};

if (!argv.proxyPort || !argv.serviceHost || !argv.servicePort) {
    argv.help();
}

var proxy = require("./tcp-proxy.js").createProxy(argv.proxyPort,
    argv.serviceHost, argv.servicePort, options);

process.on("uncaughtException", function(err) {
    console.error(err);
    proxy.end();
});

process.on("SIGINT", function() {
    proxy.end();
});
