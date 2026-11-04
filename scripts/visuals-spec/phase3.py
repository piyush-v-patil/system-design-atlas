"""
Phase 3 visual metadata spec -> content/visuals/*.ts (run: python3 scripts/visuals-spec/phase3.py).
Every claim is Q (verbatim quote) or P (paraphrase) with the README line(s) it comes from;
tests/visuals.test.ts verifies each Q appears at its cited lines.
"""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'content', 'visuals')
PASTEBIN = 'solutions/system_design/pastebin/README.md'

def Q(text, a, b=None, doc=None): return ('q', text, a, b or a, doc)
def P(text, a, b=None, doc=None): return ('p', text, a, b or a, doc)

def ts(v, ind=2):
    pad = ' ' * ind
    if isinstance(v, tuple) and v and v[0] in ('q', 'p'):
        k, text, a, b, doc = v
        args = [json.dumps(text, ensure_ascii=False), str(a)]
        if b != a or doc: args.append(str(b))
        if doc: args.append(json.dumps(doc))
        return f"{k}({', '.join(args)})"
    if isinstance(v, tuple) and v and v[0] == 'ref':
        return v[1]
    if isinstance(v, dict):
        if not v: return '{}'
        items = [f"{pad}{json.dumps(k) if not k.isidentifier() else k}: {ts(x, ind + 2)}," for k, x in v.items() if x is not None or True]
        return '{\n' + '\n'.join(items) + '\n' + ' ' * (ind - 2) + '}'
    if isinstance(v, list):
        if not v: return '[]'
        return '[\n' + '\n'.join(f"{pad}{ts(x, ind + 2)}," for x in v) + '\n' + ' ' * (ind - 2) + ']'
    if v is None: return 'null'
    return json.dumps(v, ensure_ascii=False)

def R(name): return ('ref', name)
def step(caption, claim): return {'caption': caption, 'source': claim}
def cmp(title, columns, rows, choose=None):
    d = {'title': title, 'columns': [{'key': k, 'title': t, **({'topicId': tid} if tid else {})} for k, t, tid in columns],
         'rows': [{'label': label, 'cells': cells} for label, cells in rows]}
    if choose: d['chooseWhen'] = choose
    return d
def tile(tid, claim): return {'topicId': tid, 'claim': claim}

# ------------------------------------------------------------------ shared comparisons
SHARED = {}

SHARED['cdnComparison'] = cmp('Push vs pull CDNs', [('push', 'Push CDN', 'push-cdns'), ('pull', 'Pull CDN', 'pull-cdns')], [
    ('Who moves content', {'push': Q('Push CDNs receive new content whenever changes occur on your server.', 636),
                           'pull': Q('Pull CDNs grab new content from your server when the first user requests the content.', 642)}),
    ('First request', {'push': None, 'pull': Q('This results in a slower request until the content is cached on the CDN.', 642)}),
    ('Expiry', {'push': Q('You can configure when content expires and when it is updated.', 636),
                'pull': Q('A time-to-live (TTL) determines how long content is cached.', 644)}),
    ('Storage vs traffic', {'push': Q('Content is uploaded only when it is new or changed, minimizing traffic, but maximizing storage.', 636),
                            'pull': Q('Pull CDNs minimize storage space on the CDN, but can create redundant traffic if files expire and are pulled before they have actually changed.', 644)}),
], {'push': Q("Sites with a small amount of traffic or sites with content that isn't often updated work well with push CDNs.", 638),
    'pull': Q('Sites with heavy traffic work well with pull CDNs, as traffic is spread out more evenly with only recently-requested content remaining on the CDN.', 646)})

SHARED['cdnSteps'] = {
    'pull': [
        step("The first nearby user's request misses at the edge, which pulls from your server", Q('Pull CDNs grab new content from your server when the first user requests the content.', 642)),
        step('That first request is slower', Q('This results in a slower request until the content is cached on the CDN.', 642)),
        step('Later users nearby get it straight from the edge', Q('Users receive content from data centers close to them', 631)),
        step('When the TTL expires, the file is pulled again, even if unchanged', Q('Pull CDNs minimize storage space on the CDN, but can create redundant traffic if files expire and are pulled before they have actually changed.', 644)),
    ],
    'push': [
        step('Content changes on your server, and you upload it to the CDN', Q('Push CDNs receive new content whenever changes occur on your server.', 636)),
        step('You rewrite URLs to point at the CDN', Q('You take full responsibility for providing content, uploading directly to the CDN and rewriting URLs to point to the CDN.', 636)),
        step('Users get it from the nearest edge', Q('Users receive content from data centers close to them', 631)),
        step('Only new or changed files are uploaded', Q('Content is uploaded only when it is new or changed, minimizing traffic, but maximizing storage.', 636)),
    ],
}

SHARED['lbProxyComparison'] = cmp('Load balancer vs reverse proxy', [('lb', 'Load balancer', 'load-balancer'), ('proxy', 'Reverse proxy', 'reverse-proxy-web-server')], [
    ('Routes to', {'lb': Q('Often, load balancers route traffic to a set of servers serving the same function.', 757),
                   'proxy': Q("Requests from clients are forwarded to a server that can fulfill it before the reverse proxy returns the server's response to the client.", 739)}),
], {'lb': Q('Deploying a load balancer is useful when you have multiple servers.', 757),
    'proxy': Q('Reverse proxies can be useful even with just one web server or application server, opening up the benefits described in the previous section.', 758)})

SHARED['nosqlComparison'] = cmp('Four kinds of NoSQL store', [('kv', 'Key-value', 'key-value-store'), ('doc', 'Document', 'document-store'), ('wide', 'Wide column', 'wide-column-store'), ('graph', 'Graph', 'graph-database')], [
    ('Abstraction', {'kv': Q('Abstraction: hash table', 1005), 'doc': Q('Abstraction: key-value store with documents stored as values', 1022),
                     'wide': Q('Abstraction: nested map ColumnFamily<RowKey, Columns<ColKey, Value, Timestamp>>', 1047), 'graph': Q('Abstraction: graph', 1070)}),
    ('How it works', {'kv': Q('A key-value store generally allows for O(1) reads and writes and is often backed by memory or SSD.', 1007),
                      'doc': Q('Document stores provide APIs or a query language to query based on the internal structure of the document itself.', 1024),
                      'wide': Q('Each value contains a timestamp for versioning and for conflict resolution.', 1049),
                      'graph': Q('In a graph database, each node is a record and each arc is a relationship between two nodes.', 1072)}),
], {'kv': Q('Key-value stores provide high performance and are often used for simple data models or for rapidly-changing data, such as an in-memory cache layer.', 1009),
    'doc': Q('Document stores provide high flexibility and are often used for working with occasionally changing data.', 1030),
    'wide': Q('Wide column stores offer high availability and high scalability. They are often used for very large data sets.', 1053),
    'graph': Q('Graphs databases offer high performance for data models with complex relationships, such as a social network.', 1074)})

SHARED['cacheLayerSteps'] = [
    step('Client: the OS or browser may already have it', Q('Caches can be located on the client side (OS or browser), server side, or in a distinct cache layer.', 1146)),
    step('CDN: an edge server may have it', Q('CDNs are considered a type of cache.', 1150)),
    step('Web server or reverse proxy: can answer without the app', Q('Web servers can also cache requests, returning responses without having to contact application servers.', 1154)),
    step('Application cache: Memcached or Redis in front of storage', Q('In-memory caches such as Memcached and Redis are key-value stores between your application and your data storage.', 1162)),
    step("Database: its own built-in cache", Q('Your database usually includes some level of caching in a default configuration, optimized for a generic use case.', 1158)),
]

SHARED['granularitySteps'] = {
    'query': [
        step('Hash the query as a key and store the result', Q('Whenever you query the database, hash the query as a key and store the result to the cache.', 1180)),
        step('One cell changes: every cached query that might include it must go', Q('If one piece of data changes such as a table cell, you need to delete all cached queries that might include the changed cell', 1183)),
        step('With complex queries, that is hard to work out', Q('Hard to delete a cached result with complex queries', 1182)),
    ],
    'object': [
        step('Assemble the data into an object and cache it', Q('Have your application assemble the dataset from the database into a class instance or a data structure(s):', 1187)),
        step('Data changes: remove just that object', Q('Remove the object from cache if its underlying data has changed', 1189)),
        step('Workers rebuild objects asynchronously', Q('Allows for asynchronous processing: workers assemble objects by consuming the latest cached object', 1190)),
    ],
}
SHARED['granularityComparison'] = cmp('Caching query results vs objects', [('query', 'Query level', 'caching-at-the-database-query-level'), ('object', 'Object level', 'caching-at-the-object-level')], [
    ('Cache key', {'query': Q('hash the query as a key and store the result to the cache', 1180),
                   'object': Q('assemble the dataset from the database into a class instance or a data structure(s)', 1187)}),
    ('When data changes', {'query': Q('If one piece of data changes such as a table cell, you need to delete all cached queries that might include the changed cell', 1183),
                           'object': Q('Remove the object from cache if its underlying data has changed', 1189)}),
    ('Also', {'query': Q('Hard to delete a cached result with complex queries', 1182),
              'object': Q('Allows for asynchronous processing: workers assemble objects by consuming the latest cached object', 1190)}),
])

SHARED['queueComparison'] = cmp('Message queues vs task queues', [('mq', 'Message queue', 'message-queues'), ('tq', 'Task queue', 'task-queues')], [
    ('What it does', {'mq': Q('Message queues receive, hold, and deliver messages.', 1336),
                      'tq': Q('Tasks queues receive tasks and their related data, runs them, then delivers their results.', 1351)}),
    ('Extras', {'mq': Q('The user is not blocked and the job is processed in the background.', 1341),
                'tq': Q('They can support scheduling and can be used to run computationally-intensive jobs in the background.', 1351)}),
])
SHARED['brokerComparison'] = cmp('Message brokers the Primer mentions', [('redis', 'Redis', None), ('rabbit', 'RabbitMQ', None), ('sqs', 'Amazon SQS', None)], [
    ('Trade-off', {'redis': Q('Redis is useful as a simple message broker but messages can be lost.', 1343),
                   'rabbit': Q("RabbitMQ is popular but requires you to adapt to the 'AMQP' protocol and manage your own nodes.", 1345),
                   'sqs': Q('Amazon SQS is hosted but can have high latency and has the possibility of messages being delivered twice.', 1347)}),
])

SHARED['tcpUdpComparison'] = cmp('TCP vs UDP', [('tcp', 'TCP', 'transmission-control-protocol-tcp'), ('udp', 'UDP', 'user-datagram-protocol-udp')], [
    ('Connection', {'tcp': Q('TCP is a connection-oriented protocol over an IP network.', 1410), 'udp': Q('UDP is connectionless.', 1434)}),
    ('Delivery', {'tcp': Q('All packets sent are guaranteed to reach the destination in the original order and without corruption through:', 1410),
                  'udp': Q('Datagrams might reach their destination out of order or not at all.', 1434)}),
    ('Lost data', {'tcp': Q('If the sender does not receive a correct response, it will resend the packets.', 1415), 'udp': None}),
    ('Congestion', {'tcp': Q('TCP also implements flow control and congestion control.', 1415), 'udp': Q('UDP does not support congestion control.', 1434)}),
    ('Efficiency', {'tcp': Q('These guarantees cause delays and generally result in less efficient transmission than UDP.', 1415),
                    'udp': Q('Without the guarantees that TCP support, UDP is generally more efficient.', 1434)}),
    ('Examples', {'tcp': Q('Some examples include web servers, database info, SMTP, FTP, and SSH.', 1419),
                  'udp': Q('UDP is less reliable but works well in real time use cases such as VoIP, video chat, streaming, and realtime multiplayer games.', 1438)}),
], {'tcp': Q('You need all of the data to arrive intact', 1423), 'udp': Q('You need the lowest latency', 1442)})

SHARED['tcpUdpSteps'] = {
    'tcp': [
        step('Open a connection with a handshake', Q('Connection is established and terminated using a handshake.', 1410)),
        step('Send numbered, checksummed packets; each one is acknowledged', Q('Sequence numbers and checksum fields for each packet', 1412)),
        step('Packet 3 got no acknowledgement, so it is resent', Q('If the sender does not receive a correct response, it will resend the packets.', 1415)),
        step('Everything arrives intact and in order', Q('All packets sent are guaranteed to reach the destination in the original order and without corruption through:', 1410)),
        step('The cost: delays and less efficient transmission', Q('These guarantees cause delays and generally result in less efficient transmission than UDP.', 1415)),
    ],
    'udp': [
        step('No connection to set up', Q('UDP is connectionless.', 1434)),
        step('Send datagrams', Q('Datagrams (analogous to packets) are guaranteed only at the datagram level.', 1434)),
        step('Some arrive out of order, some not at all', Q('Datagrams might reach their destination out of order or not at all.', 1434)),
        step('Nothing is resent, which suits real-time use', Q('UDP is less reliable but works well in real time use cases such as VoIP, video chat, streaming, and realtime multiplayer games.', 1438)),
    ],
}

SHARED['rpcRestComparison'] = cmp('RPC vs REST', [('rpc', 'RPC', 'remote-procedure-call-rpc'), ('rest', 'REST', 'representational-state-transfer-rest')], [
    ('Focus', {'rpc': Q('RPC is focused on exposing behaviors.', 1486), 'rest': Q('REST is focused on exposing data.', 1524)}),
    ('Coupling', {'rpc': Q('RPC clients become tightly coupled to the service implementation.', 1499),
                  'rest': Q('It minimizes the coupling between client/server and is often used for public HTTP APIs.', 1524)}),
    ('Typical use', {'rpc': Q('RPCs are often used for performance reasons with internal communications, as you can hand-craft native calls to better fit your use cases.', 1486),
                     'rest': Q('HTTP APIs following REST tend to be used more often for public APIs.', 1495)}),
    ('Scaling', {'rpc': None, 'rest': Q('Being stateless, REST is great for horizontal scaling and partitioning.', 1524)}),
], {'rpc': P('You know your target platform, want to control how your logic is accessed and how errors are handled, and performance or end-user experience matters most', 1488, 1493),
    'rest': P('Public HTTP APIs, where low coupling and a uniform interface (URIs, headers, verbs) matter', 1495, 1524)})

SHARED['interviewSummary'] = Q('The system design interview is an open-ended conversation. You are expected to lead it.', 222)

# ------------------------------------------------------------------ topic visuals
V = {}

def add(topic_id, **kw):
    V[topic_id] = {'topicId': topic_id, **kw}

# Fundamentals
add('system-design-topics-start-here', diagram='guide', component='learning-path', props={'stage': 'start'},
    summary=Q("First, you'll need a basic understanding of common principles, learning about what they are, how they are used, and their pros and cons.", 376),
    related=['step-1-review-the-scalability-video-lecture', 'step-2-review-the-scalability-article', 'next-steps', 'study-guide'])
# The two study resources: the link is the main thing; each topic it covers points to where the Atlas covers it
# (our mapping, labelled as such in the UI).
add('step-1-review-the-scalability-video-lecture', diagram='guide', component='study-resource',
    props={'kind': 'Video lecture', 'covers': 'Horizontal scaling=horizontal-scaling|Caching=cache|Load balancing=load-balancer|Database replication=replication|Database partitioning=sharding,federation'},
    related=['horizontal-scaling', 'cache', 'load-balancer', 'replication', 'sharding', 'federation'])
add('step-2-review-the-scalability-article', diagram='reference', component='study-resource',
    props={'kind': 'Article series', 'covers': 'Clones=horizontal-scaling|Databases=database|Caches=cache|Asynchronism=asynchronism'},
    related=['horizontal-scaling', 'database', 'cache', 'asynchronism'])
add('next-steps', diagram='guide', component='learning-path', props={'stage': 'tradeoffs'},
    summary=Q('Keep in mind that everything is a trade-off.', 408),
    tiles=[tile('performance-vs-scalability', Q('If you have a performance problem, your system is slow for a single user.', 418)),
           tile('latency-vs-throughput', Q('Generally, you should aim for maximal throughput with acceptable latency.', 432)),
           tile('availability-vs-consistency', Q("You'll need to make a software tradeoff between consistency and availability.", 454))])
add('performance-vs-scalability', diagram='comparison', component='perf-scale',
    summary=Q('A service is scalable if it results in increased performance in a manner proportional to resources added.', 414),
    related=['latency-vs-throughput', 'horizontal-scaling', 'load-balancer'])
add('latency-vs-throughput', diagram='comparison', component='latency-throughput',
    summary=Q('Generally, you should aim for maximal throughput with acceptable latency.', 432),
    points=[Q('Latency is the time to perform some action or to produce some result.', 428),
            Q('Throughput is the number of such actions or results per unit of time.', 430)],
    related=['performance-vs-scalability', 'latency-numbers-every-programmer-should-know', 'asynchronism'])
add('availability-vs-consistency', diagram='comparison', comparison=R('capComparison'),
    tiles=[tile('cap-theorem', Q('In a distributed computer system, you can only support two of the following guarantees:', 448)),
           tile('consistency-patterns', Q('With multiple copies of the same data, we are faced with options on how to synchronize them so clients have a consistent view of the data.', 475)),
           tile('availability-patterns', Q('There are two complementary patterns to support high availability: fail-over and replication.', 501))])

# Networking
add('domain-name-system', diagram='process', component='dns',
    summary=Q('A Domain Name System (DNS) translates a domain name such as www.example.com to an IP address.', 589),
    steps=[step("Your computer asks its ISP's DNS server for www.example.com", Q('Your router or ISP provides information about which DNS server(s) to contact when doing a lookup.', 591)),
           step("It isn't cached there, so the ISP's server asks a server higher up", Q('DNS is hierarchical, with a few authoritative servers at the top level.', 591)),
           step("The answer comes back, and the ISP's server caches it", Q('Lower level DNS servers cache mappings, which could become stale due to DNS propagation delays.', 591)),
           step('Your computer caches it too, for the TTL', Q('DNS results can also be cached by your browser or OS for a certain period of time, determined by the time to live (TTL).', 591)),
           step('Now it can reach the site by IP address', Q('A Domain Name System (DNS) translates a domain name such as www.example.com to an IP address.', 589)),
           step('Within the TTL, the next lookup is answered from cache', Q('Accessing a DNS server introduces a slight delay, although mitigated by caching described above.', 609))],
    cons=[Q('Accessing a DNS server introduces a slight delay, although mitigated by caching described above.', 609),
          Q('DNS server management could be complex and is generally managed by governments, ISPs, and large companies.', 610),
          Q("DNS services have recently come under DDoS attack, preventing users from accessing websites such as Twitter without knowing Twitter's IP address(es).", 611)],
    notes=["The Primer's DNS image shows the root DNS server answering from its own cache. That's a simplification: real lookups go from the root to the top-level-domain and then the authoritative servers. The Primer's text doesn't spell out the steps, so this animation follows its picture and text (docs/PLAN.md F6)."],
    related=['content-delivery-network', 'load-balancer', 'cdn-caching'])
add('content-delivery-network', diagram='process', component='cdn', props={'mode': 'pull'},
    summary=Q('A content delivery network (CDN) is a globally distributed network of proxy servers, serving content from locations closer to the user.', 627),
    stepsByMode=R('cdnSteps'), comparison=R('cdnComparison'),
    pros=[Q('Users receive content from data centers close to them', 631), Q('Your servers do not have to serve requests that the CDN fulfills', 632)],
    cons=[Q('CDN costs could be significant depending on traffic, although this should be weighed with additional costs you would incur not using a CDN.', 650),
          Q('Content might be stale if it is updated before the TTL expires it.', 651),
          Q('CDNs require changing URLs for static content to point to the CDN.', 652)],
    related=['push-cdns', 'pull-cdns', 'cdn-caching', 'domain-name-system'])
add('push-cdns', diagram='process', component='cdn', props={'mode': 'push', 'activeColumn': 'push'},
    stepsByMode=R('cdnSteps'), comparison=R('cdnComparison'), useWhen=R('cdnComparison.chooseWhen!.push'),
    related=['pull-cdns', 'content-delivery-network'])
add('pull-cdns', diagram='process', component='cdn', props={'mode': 'pull', 'activeColumn': 'pull'},
    stepsByMode=R('cdnSteps'), comparison=R('cdnComparison'), useWhen=R('cdnComparison.chooseWhen!.pull'),
    related=['push-cdns', 'content-delivery-network'])
add('reverse-proxy-web-server', diagram='process', component='reverse-proxy',
    summary=Q('A reverse proxy is a web server that centralizes internal services and provides unified interfaces to the public.', 739),
    steps=[step('Clients only ever see the reverse proxy', Q("Clients only see the reverse proxy's IP, allowing you to scale servers or change their configuration", 744)),
           step('Security: hide backends, blacklist IPs, limit connections', Q('Hide information about backend servers, blacklist IPs, limit number of connections per client', 743)),
           step('SSL termination: decrypt at the proxy', Q('Decrypt incoming requests and encrypt server responses so backend servers do not have to perform these potentially expensive operations', 745)),
           step('Compression of responses', Q('Compress server responses', 747)),
           step('Caching: answer repeated requests itself', Q('Return the response for cached requests', 748)),
           step('Static content served directly', Q('Serve static content directly', 749))],
    comparison=R('lbProxyComparison'),
    cons=[Q('Introducing a reverse proxy results in increased complexity.', 763),
          Q('A single reverse proxy is a single point of failure, configuring multiple reverse proxies (ie a failover) further increases complexity.', 764)],
    related=['load-balancer', 'load-balancer-vs-reverse-proxy', 'web-server-caching', 'application-layer'])
add('load-balancer-vs-reverse-proxy', diagram='comparison', component='lb-vs-proxy',
    summary=Q('Solutions such as NGINX and HAProxy can support both layer 7 reverse proxying and load balancing.', 759),
    comparison=R('lbProxyComparison'), related=['load-balancer', 'reverse-proxy-web-server', 'layer-7-load-balancing'])
add('application-layer', diagram='process', component='app-layer',
    summary=Q('Separating out the web layer from the application layer (also known as platform layer) allows you to scale and configure both layers independently.', 781),
    steps=[step('Web servers and application (platform) servers are separate layers', Q('Separating out the web layer from the application layer (also known as platform layer) allows you to scale and configure both layers independently.', 781)),
           step('A new API adds application servers, not web servers', Q('Adding a new API results in adding application servers without necessarily adding additional web servers.', 781)),
           step('Small, autonomous services that work together', Q('The single responsibility principle advocates for small and autonomous services that work together.', 781)),
           step('Workers in this layer enable asynchronism', Q('Workers in the application layer also help enable asynchronism.', 783))],
    cons=[Q('Adding an application layer with loosely coupled services requires a different approach from an architectural, operations, and process viewpoint (vs a monolithic system).', 797),
          Q('Microservices can add complexity in terms of deployments and operations.', 798)],
    related=['microservices', 'service-discovery', 'asynchronism', 'reverse-proxy-web-server'])
add('microservices', diagram='process', component='microservices',
    steps=[step('Small, independently deployable services', Q('microservices, which can be described as a suite of independently deployable, small, modular services.', 787)),
           step('Each runs its own process and talks over a lightweight mechanism', Q('Each service runs a unique process and communicates through a well-defined, lightweight mechanism to serve a business goal.', 787)),
           step("The Primer's example: Pinterest", Q('Pinterest, for example, could have the following microservices: user profile, follower, feed, search, photo upload, etc.', 789)),
           step('Each deploys on its own, which adds deployment and operations work', Q('Microservices can add complexity in terms of deployments and operations.', 798))],
    related=['application-layer', 'service-discovery', 'remote-procedure-call-rpc'])
add('service-discovery', diagram='process', component='service-discovery',
    steps=[step('Services register their name, address and port', Q('Systems such as Consul, Etcd, and Zookeeper can help services find each other by keeping track of registered names, addresses, and ports.', 793)),
           step('Health checks over an HTTP endpoint', Q('Health checks help verify service integrity and are often done using an HTTP endpoint.', 793)),
           step('A service looks another up, then calls it', Q('can help services find each other', 793)),
           step('A built-in key-value store holds shared config', Q('Both Consul and Etcd have a built in key-value store that can be useful for storing config values and other shared data.', 793))],
    related=['microservices', 'application-layer', 'key-value-store'])

# Data
add('database', diagram='guide',
    tiles=[tile('relational-database-management-system-rdbms', Q('A relational database like SQL is a collection of data items organized in tables.', 818)),
           tile('nosql', Q('NoSQL is a collection of data items represented in a key-value store, document store, wide column store, or a graph database.', 993)),
           tile('sql-or-nosql', P("Weigh the Primer's reasons for SQL and for NoSQL against your workload", 1098, 1117))],
    related=['cache', 'sharding', 'master-slave-replication'])
add('relational-database-management-system-rdbms', diagram='anatomy', component='acid-base',
    summary=Q('There are many techniques to scale a relational database: master-slave replication, master-master replication, federation, sharding, denormalization, and SQL tuning.', 827),
    tiles=[tile('master-slave-replication', Q('The master serves reads and writes, replicating writes to one or more slaves, which serve only reads.', 831)),
           tile('master-master-replication', Q('Both masters serve reads and writes and coordinate with each other on writes.', 846)),
           tile('federation', Q('Federation (or functional partitioning) splits up databases by function.', 882)),
           tile('sharding', Q('Sharding distributes data across different databases such that each database can only manage a subset of the data.', 903)),
           tile('denormalization', Q('Denormalization attempts to improve read performance at the expense of some write performance.', 925)),
           tile('sql-tuning', Q("It's important to benchmark and profile to simulate and uncover bottlenecks.", 945))],
    related=['nosql', 'sql-or-nosql', 'strong-consistency'])
add('denormalization', diagram='process', component='denormalization',
    steps=[step('Normalized: reading a feed joins two tables', Q('A read resulting in a complex database join can be very expensive, spending a significant amount of time on disk operations.', 929)),
           step('Denormalized: copy the author into posts, so no join', Q('Redundant copies of the data are written in multiple tables to avoid expensive joins.', 925)),
           step('Writes now touch both copies', Q('Denormalization attempts to improve read performance at the expense of some write performance.', 925)),
           step('Worth it because reads far outnumber writes', Q('In most systems, reads can heavily outnumber writes 100:1 or even 1000:1.', 929)),
           step('Materialized views can keep the copies consistent', Q('Some RDBMS such as PostgreSQL and Oracle support materialized views which handle the work of storing redundant information and keeping redundant copies consistent.', 925))],
    pros=[Q('Denormalization might circumvent the need for such complex joins.', 927)],
    cons=[Q('Data is duplicated.', 933),
          Q('Constraints can help redundant copies of information stay in sync, which increases complexity of the database design.', 934),
          Q('A denormalized database under heavy write load might perform worse than its normalized counterpart.', 935)],
    related=['federation', 'sharding', 'avoid-expensive-joins'])
add('sql-tuning', diagram='guide', component='key-points',
    summary=Q("It's important to benchmark and profile to simulate and uncover bottlenecks.", 945),
    tiles=[tile('tighten-up-the-schema', Q('MySQL dumps to disk in contiguous blocks for fast access.', 954)),
           tile('use-good-indices', Q('Columns that you are querying (SELECT, GROUP BY, ORDER BY, JOIN) could be faster with indices.', 966)),
           tile('avoid-expensive-joins', Q('Denormalize where performance demands it.', 974)),
           tile('partition-tables', Q('Break up a table by putting hot spots in a separate table to help keep it in memory.', 978)),
           tile('tune-the-query-cache', Q('In some cases, the query cache could lead to performance issues.', 982))],
    related=['denormalization', 'database-caching'])
for tid, rel in [('tighten-up-the-schema', ['use-good-indices', 'sql-tuning']), ('use-good-indices', ['tighten-up-the-schema', 'sql-tuning']),
                 ('avoid-expensive-joins', ['denormalization', 'sql-tuning']), ('partition-tables', ['sharding', 'sql-tuning']),
                 ('tune-the-query-cache', ['database-caching', 'sql-tuning'])]:
    add(tid, diagram='guide', component='key-points', props={'checklist': True}, related=rel)
add('nosql', diagram='comparison', component='acid-base',
    summary=Q('NoSQL is a collection of data items represented in a key-value store, document store, wide column store, or a graph database.', 993),
    comparison=R('nosqlComparison'),
    points=[Q('In comparison with the CAP Theorem, BASE chooses availability over consistency.', 995)],
    related=['sql-or-nosql', 'eventual-consistency', 'ap---availability-and-partition-tolerance'])
for tid, model, col, summ, extra in [
    ('key-value-store', 'kv', 'kv', Q('A key-value store generally allows for O(1) reads and writes and is often backed by memory or SSD.', 1007),
     {'cons': [Q('Since they offer only a limited set of operations, complexity is shifted to the application layer if additional operations are needed.', 1009)],
      'related': ['document-store', 'application-caching', 'service-discovery']}),
    ('document-store', 'document', 'doc', Q('A document store is centered around documents (XML, JSON, binary, etc), where a document stores all information for a given object.', 1024),
     {'related': ['key-value-store', 'wide-column-store']}),
    ('wide-column-store', 'wide', 'wide', Q("A wide column store's basic unit of data is a column (name/value pair).", 1049),
     {'related': ['document-store', 'graph-database']}),
    ('graph-database', 'graph', 'graph', Q('In a graph database, each node is a record and each arc is a relationship between two nodes.', 1072),
     {'cons': [Q('They are relatively new and are not yet widely-used; it might be more difficult to find development tools and resources.', 1074)],
      'related': ['wide-column-store', 'design-the-data-structures-for-a-social-network']}),
]:
    add(tid, diagram='anatomy', component='data-model', props={'model': model, 'activeColumn': col}, summary=summ,
        comparison=R('nosqlComparison'), useWhen=R(f'nosqlComparison.chooseWhen!.{col}'), **extra)
add('sql-or-nosql', diagram='comparison', component='sql-nosql-picker',
    related=['relational-database-management-system-rdbms', 'nosql', 'database'])

# Caching
add('cache', diagram='process', component='cache-layers',
    summary=Q('Caching improves page load times and can reduce the load on your servers and databases.', 1140),
    steps=R('cacheLayerSteps'),
    pros=[Q('Putting a cache in front of a database can help absorb uneven loads and spikes in traffic.', 1142)],
    cons=[Q('Need to maintain consistency between caches and the source of truth such as the database through cache invalidation.', 1310),
          Q('Cache invalidation is a difficult problem, there is additional complexity associated with when to update the cache.', 1311),
          Q('Need to make application changes such as adding Redis or memcached.', 1312)],
    related=['when-to-update-the-cache', 'application-caching', 'content-delivery-network'])
for tid, summ, pts in [
    ('client-caching', Q('Caches can be located on the client side (OS or browser), server side, or in a distinct cache layer.', 1146), None),
    ('cdn-caching', Q('CDNs are considered a type of cache.', 1150), None),
    ('web-server-caching', Q('Reverse proxies and caches such as Varnish can serve static and dynamic content directly.', 1154), None),
    ('database-caching', Q('Your database usually includes some level of caching in a default configuration, optimized for a generic use case.', 1158),
     [Q('Tweaking these settings for specific usage patterns can further boost performance.', 1158)]),
    ('application-caching', Q('In-memory caches such as Memcached and Redis are key-value stores between your application and your data storage.', 1162),
     [Q('Since the data is held in RAM, it is much faster than typical databases where data is stored on disk.', 1162),
      Q("RAM is more limited than disk, so cache invalidation algorithms such as least recently used (LRU) can help invalidate 'cold' entries and keep 'hot' data in RAM.", 1162),
      Q('Generally, you should try to avoid file-based caching, as it makes cloning and auto-scaling more difficult.', 1176)]),
]:
    kw = {'points': pts} if pts else {}
    add(tid, diagram='process', component='cache-layers', summary=summ, steps=R('cacheLayerSteps'),
        related=['cache', 'when-to-update-the-cache'], **kw)
for tid, mode in [('caching-at-the-database-query-level', 'query'), ('caching-at-the-object-level', 'object')]:
    add(tid, diagram='process', component='cache-granularity', props={'mode': mode, 'activeColumn': mode},
        stepsByMode=R('granularitySteps'), comparison=R('granularityComparison'),
        related=['caching-at-the-object-level' if mode == 'query' else 'caching-at-the-database-query-level', 'cache-aside', 'application-caching'])

# Async
add('asynchronism', diagram='process', component='async-flow',
    summary=Q('Asynchronous workflows help reduce request times for expensive operations that would otherwise be performed in-line.', 1332),
    steps=[step('A request needs an expensive operation', Q('Asynchronous workflows help reduce request times for expensive operations that would otherwise be performed in-line.', 1332)),
           step('The web server queues the job and answers right away', Q('An application publishes a job to the queue, then notifies the user of job status', 1338)),
           step('A queue consumer does the work and writes the result', Q('A worker picks up the job from the queue, processes it, then signals the job is complete', 1339)),
           step('Work can also be done ahead of time', Q('They can also help by doing time-consuming work in advance, such as periodic aggregation of data.', 1332))],
    tiles=[tile('message-queues', Q('Message queues receive, hold, and deliver messages.', 1336)),
           tile('task-queues', Q('Tasks queues receive tasks and their related data, runs them, then delivers their results.', 1351)),
           tile('back-pressure', Q('Back pressure can help by limiting the queue size, thereby maintaining a high throughput rate and good response times for jobs already in the queue.', 1357))],
    cons=[Q('Use cases such as inexpensive calculations and realtime workflows might be better suited for synchronous operations, as introducing queues can add delays and complexity.', 1361)],
    related=['application-layer', 'write-behind-write-back'])
add('message-queues', diagram='process', component='message-queue',
    summary=Q('Message queues receive, hold, and deliver messages.', 1336),
    steps=[step('Publish the job and tell the user its status', Q('An application publishes a job to the queue, then notifies the user of job status', 1338)),
           step("The user isn't blocked: the tweet shows on their own timeline", Q('For example, if posting a tweet, the tweet could be instantly posted to your timeline, but it could take some time before your tweet is actually delivered to all of your followers.', 1341)),
           step('A worker picks up the job', Q('A worker picks up the job from the queue, processes it, then signals the job is complete', 1339)),
           step('It delivers the tweet to followers in the background', Q('The user is not blocked and the job is processed in the background.', 1341)),
           step('The worker signals the job is complete', Q('then signals the job is complete', 1339))],
    comparison=R('brokerComparison'), related=['task-queues', 'back-pressure', 'asynchronism'])
add('task-queues', diagram='process', component='task-queue',
    summary=Q('Tasks queues receive tasks and their related data, runs them, then delivers their results.', 1351),
    steps=[step('Tasks arrive with their data', Q('Tasks queues receive tasks and their related data', 1351)),
           step('Compute-heavy jobs run in the background', Q('can be used to run computationally-intensive jobs in the background', 1351)),
           step('Results are delivered', Q('runs them, then delivers their results', 1351)),
           step('Tasks can also be scheduled', Q('They can support scheduling', 1351))],
    comparison=R('queueComparison'),
    points=[Q('Celery has support for scheduling and primarily has python support.', 1353)],
    related=['message-queues', 'back-pressure', 'asynchronism'])
add('back-pressure', diagram='simulation', component='back-pressure',
    summary=Q('If queues start to grow significantly, the queue size can become larger than memory, resulting in cache misses, disk reads, and even slower performance.', 1357),
    points=[Q('Back pressure can help by limiting the queue size, thereby maintaining a high throughput rate and good response times for jobs already in the queue.', 1357),
            Q('Clients can retry the request at a later time, perhaps with exponential backoff.', 1357)],
    related=['message-queues', 'task-queues', 'asynchronism'])

# Communication
add('communication', diagram='anatomy', component='osi',
    tiles=[tile('hypertext-transfer-protocol-http', Q('HTTP is a method for encoding and transporting data between a client and a server.', 1380)),
           tile('transmission-control-protocol-tcp', Q('TCP is a connection-oriented protocol over an IP network.', 1410)),
           tile('user-datagram-protocol-udp', Q('UDP is connectionless.', 1434)),
           tile('remote-procedure-call-rpc', Q('In an RPC, a client causes a procedure to execute on a different address space, usually a remote server.', 1463)),
           tile('representational-state-transfer-rest', Q('REST is an architectural style enforcing a client/server model where the client acts on a set of resources managed by the server.', 1506)),
           tile('rpc-and-rest-calls-comparison', P('The same operations written as RPC calls and as REST calls', 1535, 1543))],
    related=['layer-4-load-balancing', 'layer-7-load-balancing'])
add('hypertext-transfer-protocol-http', diagram='anatomy', component='http-verbs',
    summary=Q('It is a request/response protocol: clients issue requests and servers issue responses with relevant content and completion status info about the request.', 1380),
    points=[Q('HTTP is self-contained, allowing requests and responses to flow through many intermediate routers and servers that perform load balancing, caching, encryption, and compression.', 1380),
            Q('HTTP is an application layer protocol relying on lower-level protocols such as TCP and UDP.', 1394)],
    related=['representational-state-transfer-rest', 'transmission-control-protocol-tcp', 'layer-7-load-balancing'])
add('transmission-control-protocol-tcp', diagram='process', component='tcp-udp', props={'mode': 'tcp', 'activeColumn': 'tcp'},
    stepsByMode=R('tcpUdpSteps'), comparison=R('tcpUdpComparison'),
    useWhen=Q('TCP is useful for applications that require high reliability but are less time critical.', 1419),
    points=[Q('Connection pooling can help in addition to switching to UDP where applicable.', 1417)],
    related=['user-datagram-protocol-udp', 'layer-4-load-balancing', 'hypertext-transfer-protocol-http'])
add('user-datagram-protocol-udp', diagram='process', component='tcp-udp', props={'mode': 'udp', 'activeColumn': 'udp'},
    stepsByMode=R('tcpUdpSteps'), comparison=R('tcpUdpComparison'),
    useWhen=Q('UDP is less reliable but works well in real time use cases such as VoIP, video chat, streaming, and realtime multiplayer games.', 1438),
    points=[Q('UDP can broadcast, sending datagrams to all devices on the subnet.', 1436)],
    related=['transmission-control-protocol-tcp', 'weak-consistency'])
add('remote-procedure-call-rpc', diagram='process', component='rpc',
    summary=Q('In an RPC, a client causes a procedure to execute on a different address space, usually a remote server.', 1463),
    steps=[step('The client program calls the client stub', Q('Client program - Calls the client stub procedure. The parameters are pushed onto the stack like a local procedure call.', 1467)),
           step('The client stub marshals the call into a message', Q('Client stub procedure - Marshals (packs) procedure id and arguments into a request message.', 1468)),
           step('The OS sends it to the server', Q('Client communication module - OS sends the message from the client to the server.', 1469)),
           step('The server OS passes it to the server stub', Q('Server communication module - OS passes the incoming packets to the server stub procedure.', 1470)),
           step('The server stub unmarshals and calls the procedure', Q('Server stub procedure - Unmarshalls the results, calls the server procedure matching the procedure id and passes the given arguments.', 1471)),
           step('The reply retraces the same steps in reverse', Q('The server response repeats the steps above in reverse order.', 1472))],
    comparison=R('rpcRestComparison'), useWhen=R('rpcRestComparison.chooseWhen!.rpc'),
    cons=[Q('RPC clients become tightly coupled to the service implementation.', 1499),
          Q('A new API must be defined for every new operation or use case.', 1500),
          Q('It can be difficult to debug RPC.', 1501)],
    related=['representational-state-transfer-rest', 'rpc-and-rest-calls-comparison', 'microservices'])
add('representational-state-transfer-rest', diagram='anatomy', component='rest',
    summary=Q('REST is an architectural style enforcing a client/server model where the client acts on a set of resources managed by the server.', 1506),
    comparison=R('rpcRestComparison'), useWhen=R('rpcRestComparison.chooseWhen!.rest'),
    related=['remote-procedure-call-rpc', 'rpc-and-rest-calls-comparison', 'hypertext-transfer-protocol-http'])
add('rpc-and-rest-calls-comparison', diagram='comparison', component='rpc-rest-table',
    comparison=R('rpcRestComparison'), related=['remote-procedure-call-rpc', 'representational-state-transfer-rest'])

# Security
add('security', diagram='guide', component='key-points', props={'checklist': True},
    summary=Q("Unless you have considerable experience, a security background, or are applying for a position that requires knowledge of security, you probably won't need to know more than the basics:", 1564),
    related=['reverse-proxy-web-server', 'load-balancer'])

# Appendix
add('appendix', diagram='guide',
    summary=Q("You'll sometimes be asked to do 'back-of-the-envelope' estimates.", 1579),
    tiles=[tile('powers-of-two-table', P('Exact and approximate values of powers of two, and their sizes in bytes', 1583, 1594)),
           tile('latency-numbers-every-programmer-should-know', P('How long common operations take, from an L1 cache hit to a round trip between continents', 1602, 1626)),
           tile('additional-system-design-interview-questions', Q('Common system design interview questions, with links to resources on how to solve each.', 1650)),
           tile('real-world-architectures', Q('Articles on how real world systems are designed.', 1681)),
           tile('company-architectures', P('Architecture write-ups for companies such as Amazon, Netflix and Twitter', 1721, 1745)),
           tile('company-engineering-blogs', Q('Architectures for companies you are interviewing with.', 1749))],
    related=['back-of-the-envelope-calculations'])
add('powers-of-two-table', diagram='calculator', component='powers-of-two',
    related=['latency-numbers-every-programmer-should-know', 'back-of-the-envelope-calculations'])
add('latency-numbers-every-programmer-should-know', diagram='calculator', component='latency-chart',
    related=['powers-of-two-table', 'back-of-the-envelope-calculations', 'latency-vs-throughput', 'cache'])
add('latency-numbers-visualized', diagram='calculator', component='latency-chart',
    related=['latency-numbers-every-programmer-should-know'])
add('additional-system-design-interview-questions', diagram='reference', component='table-explorer',
    summary=Q('Common system design interview questions, with links to resources on how to solve each.', 1650),
    related=['system-design-interview-questions-with-solutions', 'real-world-architectures'])
add('real-world-architectures', diagram='reference', component='table-explorer', props={'groupBy': 0},
    summary=Q('Articles on how real world systems are designed.', 1681),
    points=[Q('Identify shared principles, common technologies, and patterns within these articles', 1691),
            Q("Study what problems are solved by each component, where it works, where it doesn't", 1692),
            Q('Review the lessons learned', 1693)],
    related=['company-architectures', 'company-engineering-blogs'])
add('company-architectures', diagram='reference', component='table-explorer',
    related=['real-world-architectures', 'company-engineering-blogs'])
add('company-engineering-blogs', diagram='reference', component='reading-list', props={'grid': True},
    summary=Q('Architectures for companies you are interviewing with.', 1749),
    points=[Q('Questions you encounter might be from the same domain.', 1751)],
    related=['company-architectures', 'real-world-architectures'])
add('under-development', diagram='guide', component='key-points', related=['sharding', 'contributing'])

# Guide
add('the-system-design-primer', diagram='guide', component='learning-path',
    summary=Q('Learn how to design large-scale systems.', 14),
    related=['study-guide', 'how-to-approach-a-system-design-interview-question', 'index-of-system-design-topics'])
add('motivation', diagram='guide',
    summary=Q('Prep for the system design interview.', 16),
    tiles=[tile('learn-how-to-design-large-scale-systems', Q('Learning how to design scalable systems will help you become a better engineer.', 20)),
           tile('learn-from-the-open-source-community', Q('This is a continually updated, open source project.', 28)),
           tile('prep-for-the-system-design-interview', Q('In addition to coding interviews, system design is a required component of the technical interview process at many tech companies.', 34))])
add('learn-how-to-design-large-scale-systems', diagram='guide', component='key-points',
    points=[Q('Learning how to design scalable systems will help you become a better engineer.', 20),
            Q('System design is a broad topic. There are a vast number of resources scattered throughout the web on system design principles.', 22),
            Q('This repo is an organized collection of resources to help you learn how to build systems at scale.', 24)],
    related=['system-design-topics-start-here'])
add('learn-from-the-open-source-community', diagram='guide', component='key-points',
    points=[Q('This is a continually updated, open source project.', 28), Q('Contributions are welcome!', 30)],
    related=['contributing'])
add('prep-for-the-system-design-interview', diagram='guide', component='key-points',
    points=[Q('In addition to coding interviews, system design is a required component of the technical interview process at many tech companies.', 34),
            Q('Practice common system design interview questions and compare your results with sample solutions: discussions, code, and diagrams.', 36)],
    related=['study-guide', 'how-to-approach-a-system-design-interview-question'])
add('anki-flashcards', diagram='reference', component='reading-list',
    summary=Q('The provided Anki flashcard decks use spaced repetition to help you retain key system design concepts.', 53),
    related=['coding-resource-interactive-coding-challenges', 'study-guide'])
add('coding-resource-interactive-coding-challenges', diagram='reference', component='reading-list', related=['anki-flashcards'])
add('contributing', diagram='guide', component='key-points',
    points=[Q('Content that needs some polishing is placed under development.', 85)], related=['under-development'])
add('index-of-system-design-topics', diagram='guide', component='learning-path',
    summary=Q('Summaries of various system design topics, including pros and cons. Everything is a trade-off.', 91),
    related=['study-guide', 'system-design-topics-start-here'])
add('study-guide', diagram='guide', component='study-guide',
    summary=Q('Suggested topics to review based on your interview timeline (short, medium, long).', 184),
    points=[Q("A: No, you don't need to know everything here to prepare for the interview.", 190),
            Q('More experienced candidates are generally expected to know more about system design.', 200),
            Q('Start broad and go deeper in a few areas. It helps to know a little about various key system design topics.', 202)],
    related=['system-design-topics-start-here', 'how-to-approach-a-system-design-interview-question'])
add('how-to-approach-a-system-design-interview-question', diagram='guide', component='interview-steps', props={'step': 1},
    summary=R('interviewSummary'), related=['back-of-the-envelope-calculations', 'system-design-interview-questions-with-solutions'])
for n, tid, summ in [
    (1, 'step-1-outline-use-cases-constraints-and-assumptions', Q('Gather requirements and scope the problem. Ask questions to clarify use cases and constraints. Discuss assumptions.', 228)),
    (2, 'step-2-create-a-high-level-design', Q('Outline a high level design with all important components.', 241)),
    (3, 'step-3-design-core-components', Q('Dive into details for each core component.', 248)),
    (4, 'step-4-scale-the-design', Q('Identify and address bottlenecks, given the constraints.', 261)),
]:
    add(tid, diagram='guide', component='interview-steps', props={'step': n}, summary=summ,
        related=['how-to-approach-a-system-design-interview-question', 'system-design-interview-questions-with-solutions'])
add('back-of-the-envelope-calculations', diagram='calculator', component='envelope',
    summary=Q('You might be asked to do some estimates by hand.', 272),
    points=[Q('2.5 million seconds per month', 73, 73, PASTEBIN), Q('1 request per second = 2.5 million requests per month', 74, 74, PASTEBIN),
            Q('40 requests per second = 100 million requests per month', 75, 75, PASTEBIN), Q('400 requests per second = 1 billion requests per month', 76, 76, PASTEBIN),
            Q('4 paste writes per second on average', 68, 68, PASTEBIN), Q('12.7 GB of new paste content per month', 63, 63, PASTEBIN)],
    related=['powers-of-two-table', 'latency-numbers-every-programmer-should-know', 'step-1-outline-use-cases-constraints-and-assumptions'])
add('system-design-interview-questions-with-solutions', diagram='guide', component='problem-gallery',
    summary=Q('Common system design interview questions with sample discussions, code, and diagrams.', 289),
    related=['how-to-approach-a-system-design-interview-question', 'additional-system-design-interview-questions'])
for tid in ['design-pastebincom-or-bitly', 'design-the-twitter-timeline-and-search-or-facebook-feed-and-search', 'design-a-web-crawler', 'design-mintcom',
            'design-the-data-structures-for-a-social-network', 'design-a-key-value-store-for-a-search-engine',
            'design-amazons-sales-ranking-by-category-feature', 'design-a-system-that-scales-to-millions-of-users-on-aws']:
    add(tid, diagram='guide', component='problem-card', related=['how-to-approach-a-system-design-interview-question', 'back-of-the-envelope-calculations'])
add('object-oriented-design-interview-questions-with-solutions', diagram='guide', component='ood-gallery',
    summary=Q('Common object-oriented design interview questions with sample discussions, code, and diagrams.', 355),
    points=[Q('Note: This section is under development', 359)], related=['system-design-interview-questions-with-solutions'])
add('credits', diagram='reference', component='reading-list', props={'grid': True},
    summary=Q('Credits and sources are provided throughout this repo.', 1811), related=['license'])
add('contact-info', diagram='guide', component='key-points',
    points=[Q('Feel free to contact me to discuss any issues, questions, or comments.', 1827), Q('My contact info can be found on my GitHub page.', 1829)],
    related=['credits'])
add('license', diagram='guide', component='key-points',
    points=[Q('I am providing code and resources in this repository to you under an open source license. Because this is my personal repository, the license you receive to my code and resources is from me and not my employer (Facebook).', 1833),
            Q('Creative Commons Attribution 4.0 International License (CC BY 4.0)', 1837)],
    related=['credits', 'contact-info'])

# ------------------------------------------------------------------ emit
os.makedirs(os.path.join(ROOT, '_shared'), exist_ok=True)
with open(os.path.join(ROOT, '_shared', 'phase3.ts'), 'w') as f:
    f.write('// Generated by scripts/visuals-spec/phase3.py: edit the spec, not this file.\n')
    f.write("import { p, q, type Comparison, type ProcessStep, type Claim } from '../types.ts'\n\n")
    types = {'cdnSteps': 'Record<string, ProcessStep[]>', 'granularitySteps': 'Record<string, ProcessStep[]>', 'tcpUdpSteps': 'Record<string, ProcessStep[]>',
             'cacheLayerSteps': 'ProcessStep[]', 'interviewSummary': 'Claim'}
    for name, val in SHARED.items():
        f.write(f"export const {name}: {types.get(name, 'Comparison')} = {ts(val)}\n\n")

# Sections removed from the Atlas (content/scope.json): no visual, and no links pointing at them.
with open(os.path.join(ROOT, '..', 'scope.json')) as f:
    scope_roots = set(json.load(f)['removedSections'])
with open(os.path.join(ROOT, '..', 'topics.json')) as f:
    _t = json.load(f)
REMOVED = set()
def _drop(i):
    REMOVED.add(i)
    for c in _t['nodes'][i]['childIds']: _drop(c)
for r in scope_roots: _drop(r)
for tid in list(V):
    if tid in REMOVED:
        del V[tid]
        path = os.path.join(ROOT, f'{tid}.ts')
        if os.path.exists(path): os.remove(path)
for v in V.values():
    if 'related' in v: v['related'] = [r for r in v['related'] if r not in REMOVED]
    if 'tiles' in v: v['tiles'] = [t for t in v['tiles'] if t['topicId'] not in REMOVED]

shared_names = set(SHARED) | {'capComparison'}
for tid, v in V.items():
    body = ts(v)
    used = sorted({n for n in shared_names if f'{n}' in body and (f' {n}' in body or f'({n}' in body)})
    helpers = [h for h in ('p', 'q') if f'{h}(' in body.replace('step(', '')]
    imports = [f"import {{ {', '.join(helpers + ['type TopicVisual'])} }} from './types.ts'"]
    p3 = [n for n in used if n in SHARED]
    if p3: imports.append(f"import {{ {', '.join(p3)} }} from './_shared/phase3.ts'")
    if 'capComparison' in used: imports.append("import { capComparison } from './_shared/cap.ts'")
    with open(os.path.join(ROOT, f'{tid}.ts'), 'w') as f:
        f.write('// Generated by scripts/visuals-spec/phase3.py: edit the spec, not this file.\n')
        f.write('\n'.join(imports) + '\n\n')
        f.write(f'export default {body} satisfies TopicVisual\n')
print(f'wrote {len(V)} topic visuals and {len(SHARED)} shared definitions')
