This code started its public life as a [post](https://delog.wordpress.com/2011/04/08/a-simple-tcp-proxy-in-node-js/) on my blog several years back.

A simple TCP proxy that may be used to access a service on another network. An extensible replacement for socat when used thus

socat TCP-LISTEN:port1,fork TCP:host:port2

Where port1 is where socat listens for incoming requests. host and port2 are the host and port where the actual service is listening at.

To achieve the same with node-tcp-proxy

node tcpproxy.js  --proxyPort [port] --serviceHost [host] --servicePort [port]
