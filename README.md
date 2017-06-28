# node-tcp-proxy [![Codacy Badge](https://api.codacy.com/project/badge/Grade/3e3d035c4b78445bbec6fb348cf027e1)](https://www.codacy.com/app/tewarid/node-tcp-proxy?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=tewarid/node-tcp-proxy&amp;utm_campaign=Badge_Grade)

A simple TCP proxy that may be used to access a service on another network. An extensible replacement for socat when used thus

```bash
socat TCP-LISTEN:port1,fork TCP:host:port2
```

`port1` is where socat listens for incoming requests. `host` and `port2` are the host and port where the actual service is listening at.

To achieve the same with node-tcp-proxy

```bash
tcpproxy  --proxyPort port1 [--hostname [IP]] --serviceHost host --servicePort port2 [--q]
```

Optionally, `hostname` specifies the IP address to listen at. Node.js listens on unspecified IPv6 address `::` by default.

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
