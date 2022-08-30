import { Socket } from 'net';
import { TLSSocket ,TlsOptions} from 'tls';

// Name or IP address of service host(s); if this is a list, performs round-robin load balancing
type ServiceHost = string | string[];

// Service port number(s); if this a list, it should have as many entries as serviceHost 
type ServicePort = string | number | number[];

interface ContextBase {
    buffers: Buffer[];
    connect: boolean;
}

interface UpstreamContext extends ContextBase {
    proxySocket: Socket | TLSSocket;
}

interface DownstreamContext  extends ContextBase {
    serviceSocket: Socket | TLSSocket;
}

interface TcpProxyOptions {
    // Name or IP address of host
    hostname: string;
    // IP address of interface to use to connect to service
    localAddress: string;
    // Port number to use to connect to service
    localPort: number;
    // Be quiet, default: true
    quiet: boolean;
    // Use TLS 1.2 with clients; specify both to also use TLS 1.2 with service
    tls: boolean;
    // Do not accept invalid certificate, default: true
    rejectUnauthorized: boolean;
    // Private key file path, for example: ./cert.pfx
    pfx: string;
    // Passphrase to access private key file
    passphrase: string;
    // List of authorized users
    identUsers: string[];
    // List of allowed IPs
    allowedIPs: string[];
    // Custom tls server options
    customTlsOptions: TlsOptions;
    serviceHostSelected: (proxySocket: Socket | TLSSocket, i: number) => number;
    upstream: (context: UpstreamContext, data: Buffer) => Buffer;
    downstream: (context: DownstreamContext, data: Buffer) => Buffer;
}

declare class TcpProxy {
    constructor(
        proxyPort: number, 
        serviceHost: ServiceHost, 
        servicePort: ServicePort, 
        options?: Partial<TcpProxyOptions>
    ); 
    end(): void;
}

export function createProxy(
    proxyPort: number, 
    serviceHost: ServiceHost, 
    servicePort: ServicePort, 
    options?: Partial<TcpProxyOptions>
): TcpProxy;
