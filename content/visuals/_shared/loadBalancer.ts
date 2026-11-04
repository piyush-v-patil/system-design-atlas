import { p, q, type Claim, type Comparison, type ProcessStep } from '../types.ts'

export const layerSteps: Record<'L4' | 'L7', ProcessStep[]> = {
  L4: [
    { caption: 'The layer 4 balancer reads the transport-layer header', source: q('Layer 4 load balancers look at info at the transport layer to decide how to distribute requests.', 695) },
    { caption: 'Only IP addresses and ports, not the contents of the packet', source: q('Generally, this involves the source, destination IP addresses, and ports in the header, but not the contents of the packet.', 695) },
    {
      caption: 'It forwards packets to an upstream server using NAT, without regard to content',
      source: q('Layer 4 load balancers forward network packets to and from the upstream server, performing Network Address Translation (NAT).', 695),
    },
    {
      caption: 'Less time and compute than layer 7, at the cost of flexibility',
      source: q('At the cost of flexibility, layer 4 load balancing requires less time and computing resources than Layer 7, although the performance impact can be minimal on modern commodity hardware.', 701),
    },
  ],
  L7: [
    {
      caption: 'The layer 7 balancer terminates the client connection',
      source: q('Layer 7 load balancers terminate network traffic, reads the message, makes a load-balancing decision, then opens a connection to the selected server.', 699),
    },
    { caption: 'It reads the header, message and cookies', source: q('This can involve contents of the header, message, and cookies.', 699) },
    { caption: 'Video traffic goes to the servers that host videos', source: q('a layer 7 load balancer can direct video traffic to servers that host videos', 699) },
    { caption: 'Billing traffic goes to security-hardened servers', source: q('directing more sensitive user billing traffic to security-hardened servers', 699) },
  ],
}

export const layerChoose = {
  L4: p('Speed and low resource use matter more than routing on content', 701),
  L7: p('Routing has to depend on content, e.g. video to video servers and billing to security-hardened servers', 699),
}

export const layerComparison: Comparison = {
  title: 'Layer 4 vs layer 7 load balancing',
  columns: [
    { key: 'L4', title: 'Layer 4', topicId: 'layer-4-load-balancing' },
    { key: 'L7', title: 'Layer 7', topicId: 'layer-7-load-balancing' },
  ],
  rows: [
    {
      label: 'Looks at',
      cells: {
        L4: q('Layer 4 load balancers look at info at the transport layer to decide how to distribute requests.', 695),
        L7: q('Layer 7 load balancers look at the application layer to decide how to distribute requests.', 699),
      },
    },
    { label: 'Reads', cells: { L4: q('the source, destination IP addresses, and ports in the header, but not the contents of the packet', 695), L7: q('contents of the header, message, and cookies', 699) } },
    {
      label: 'Connection',
      cells: {
        L4: q('forward network packets to and from the upstream server, performing Network Address Translation (NAT)', 695),
        L7: q('terminate network traffic, reads the message, makes a load-balancing decision, then opens a connection to the selected server', 699),
      },
    },
    { label: 'Cost', cells: { L4: q('layer 4 load balancing requires less time and computing resources than Layer 7', 701), L7: q('the performance impact can be minimal on modern commodity hardware', 701) } },
  ],
  chooseWhen: layerChoose,
}

export const lbPros: Claim[] = [
  q('Preventing requests from going to unhealthy servers', 670),
  q('Preventing overloading resources', 671),
  q('Helping to eliminate a single point of failure', 672),
  q('SSL termination - Decrypt incoming requests and encrypt server responses so backend servers do not have to perform these potentially expensive operations', 678),
  q("Session persistence - Issue cookies and route a specific client's requests to same instance if the web apps do not keep track of sessions", 680),
]

export const lbCons: Claim[] = [
  q('The load balancer can become a performance bottleneck if it does not have enough resources or if it is not configured properly.', 716),
  q('Introducing a load balancer to help eliminate a single point of failure results in increased complexity.', 717),
  q('A single load balancer is a single point of failure, configuring multiple load balancers further increases complexity.', 718),
]
