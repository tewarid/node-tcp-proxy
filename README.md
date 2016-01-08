A simple TCP proxy that may be used to access a service on another network. An extensible replacement for socat when used thus
```
socat TCP-LISTEN:port1,fork TCP:host:port2
```
port1 is where socat listens for incoming requests. host and port2 are the host and port where the actual service is listening at.

To achieve the same with node-tcp-proxy
```
node tcpproxy.js  --proxyPort [port] --serviceHost [host] --servicePort [port]
```
