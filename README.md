# node-tcp-proxy [![Build Status](https://semaphoreci.com/api/v1/tewarid/node-tcp-proxy/branches/master/badge.svg)](https://semaphoreci.com/tewarid/node-tcp-proxy) [![Codacy Badge](https://app.codacy.com/project/badge/Grade/a882a604851b494caf65b3913592da4c)](https://www.codacy.com/gh/tewarid/node-tcp-proxy/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=tewarid/node-tcp-proxy&amp;utm_campaign=Badge_Grade) [![Maintainability](https://api.codeclimate.com/v1/badges/119038e281e93a7d5d05/maintainability)](https://codeclimate.com/github/tewarid/node-tcp-proxy/maintainability)

A [classical](https://tools.ietf.org/html/rfc1919) TCP proxy that may be used to access a service on another network. An extensible replacement for socat when used thus

```bash
socat TCP-LISTEN:port,fork TCP:host:port
```

`port` is where socat listens for incoming requests. `host:port` are the host and port where the actual service is listening at.

To achieve the same with node-tcp-proxy

```bash
tcpproxy  --proxyPort port [--hostname <name or IP>] --serviceHost host1,host2 --servicePort port1,port2 [--q] [--tls [both]] [--pfx file] [--passphrase secret]
```

Optionally, use `--hostname` to specify host or IP address to listen at. Node.js listens on unspecified IPv6 address `::` by default. If `--serviceHost` and `--servicePort` specify a comma separated list, the proxy will perform load balancing on a round-robin basis.

TLS can be enabled at the proxy port using `--tls`. Use `--pfx` followed by path to specify server certificate, and `--passphrase` to provide the password required to access it. Use `--tls both`, to also enable TLS with the service.

## npm

Install node-tcp-proxy using [npm](https://www.npmjs.com/package/node-tcp-proxy)

```bash
sudo npm install -g node-tcp-proxy
```

## Programming Interface

To create a proxy in your own code

```javascript
var proxy = require("node-tcp-proxy");
var newProxy = proxy.createProxy(8080, "host", 10080);
```

To end the proxy

```javascript
newProxy.end();
```

`hostname` can be provided through an optional fourth parameter e.g. `{hostname: 0.0.0.0}` to `createProxy`. Console output may be silenced by adding `quiet: true` e.g. `{hostname: 0.0.0.0, quiet: true}`.

If you specify more than one service host and port pair, the proxy will perform round-robin load balancing

```javascript
var hosts = ["host1", "host2"];
var ports = [10080, 10080];
var newProxy = proxy.createProxy(8080, hosts, ports);
// or var newProxy = proxy.createProxy(8080, "host1,host2", "10080,10080");
```

You can intercept and modify data sent in either direction, and modify the service host selection strategy

```javascript
var proxy = require("node-tcp-proxy");
var util = require("util");
var serviceHosts = ["www.google.com", "www.bing.com"];
var servicePorts = [80, 80];
var newProxy = proxy.createProxy(8080, serviceHosts, servicePorts, {
    upstream: function(context, data) {
        console.log(util.format("Client %s:%s sent:",
            context.proxySocket.remoteAddress,
            context.proxySocket.remotePort));
        // do something with the data and return modified data
        return data;
    },
    downstream: function(context, data) {
        console.log(util.format("Service %s:%s sent:",
            context.serviceSocket.remoteAddress,
            context.serviceSocket.remotePort));
        // do something with the data and return modified data
        return data;
    },
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
```

## Alternatives

You may want to check out these interesting alternatives

* [http-proxy](https://github.com/http-party/node-http-proxy) - programmable proxying library that supports websockets. It is suitable for implementing components such as reverse proxies and load balancers.

* [sslh](https://github.com/yrutschle/sslh) - accepts connections on specified ports, and forwards them further based on tests performed on the first data packet sent by the remote client.

* [socat](http://www.dest-unreach.org/socat/) - socat is a relay for bidirectional data transfer between two independent data channels. Each of these data channels may be a file, pipe, device (serial line etc. or a pseudo terminal), a socket (UNIX, IP4, IP6 - raw, UDP, TCP), an SSL socket, proxy CONNECT connection, a file descriptor (stdin etc.), the GNU line editor (readline), a program, or a combination of two of these.
