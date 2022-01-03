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
    .option("-m, --localAddress <address>",
        "IP address of interface to use to connect to service")
    .option("-l, --localPort <port>",
        "Port number to use to connect to service")
    .option("-q, --q", "Be quiet")
    .option("-t, --tls [both]", "Use TLS 1.2 with clients; " +
        "specify both to also use TLS 1.2 with service", false)
    .option("-u, --rejectUnauthorized [value]",
        "Do not accept invalid certificate", false)
    .option("-c, --pfx [file]", "Private key file",
        require.resolve("./cert.pfx"))
    .option("-a, --passphrase [value]",
        "Passphrase to access private key file", "abcd")
    .option("-i, --identUsers [user[,...]]",
        "Comma-separated list of authorized users", "")
    .option("-A, --allowedIPs [ip1[,...]]",
        "Comma-separated list of allowed IPs, overrides -i", "")
    .parse(process.argv);

var options = Object.assign(argv, {
    quiet: argv.q === true,
    rejectUnauthorized: argv.rejectUnauthorized !== "false",
    identUsers: argv.identUsers === '' ? [] : argv.identUsers.split(','),
    allowedIps: argv.allowedIPs === '' ? [] : argv.allowedIPs.split(',')
});

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
