# node-tcp-proxy [![Build Status](https://semaphoreci.com/api/v1/tewarid/node-tcp-proxy/branches/master/badge.svg)](https://semaphoreci.com/tewarid/node-tcp-proxy) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/3e3d035c4b78445bbec6fb348cf027e1)](https://www.codacy.com/app/tewarid/node-tcp-proxy?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=tewarid/node-tcp-proxy&amp;utm_campaign=Badge_Grade) [![Maintainability](https://api.codeclimate.com/v1/badges/119038e281e93a7d5d05/maintainability)](https://codeclimate.com/github/tewarid/node-tcp-proxy/maintainability)

A simple TCP proxy that may be used to access a service on another network. An extensible replacement for socat when used thus

```bash
socat TCP-LISTEN:port,fork TCP:host:port
```

`port` is where socat listens for incoming requests. `host:port` are the host and port where the actual service is listening at.

To achieve the same with node-tcp-proxy

```bash
tcpproxy  --proxyPort port [--hostname <name or IP>] --serviceHost host1,host2 --servicePort port1,port2 [--q] [--tls [both]] [--pfx file] [--passphrase secret]
```

Optionally, `hostname` specifies the IP address to listen at. Node.js listens on unspecified IPv6 address `::` by default. If `serviceHost` and `servicePort` specify a comma separated list, the proxy will perform load balancing on a round-robin basis.

TLS can be enabled at the proxy port using the `tls` option. If followed by `both`, TLS is also used with the service. Use `pfx` option to specify server certificate, and `passphrase` to provide the password required to access it.

## npm

Install node-tcp-proxy from [npm](https://www.npmjs.com/package/node-tcp-proxy), thus
```
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
