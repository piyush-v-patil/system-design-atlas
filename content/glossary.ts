/**
 * Short explanations for the concepts the text links out to (mostly Wikipedia), so readers can understand a term
 * without leaving the page. Written in our own words (not copied: Wikipedia's text is CC BY-SA), each one paragraph or
 * two at most. Keyed by the link target exactly as written in the text; tests/glossary.test.ts checks each key is used.
 */
export interface GlossaryEntry {
  term: string
  text: string[]
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  'https://en.wikipedia.org/wiki/Time_to_live': {
    term: 'Time to live (TTL)',
    text: [
      'A limit on how long a piece of data stays valid. For a cached DNS answer or cache entry, the TTL is a number of seconds after which the copy is thrown away and fetched again; for a network packet it is a hop count that stops the packet circling forever.',
    ],
  },
  'https://en.wikipedia.org/wiki/X.509': {
    term: 'X.509 certificates',
    text: [
      'The standard format for the digital certificates used by TLS/HTTPS. A certificate binds a public key to a name such as a domain and is signed by a certificate authority, so a client can check it is really talking to that domain.',
    ],
  },
  'https://en.wikipedia.org/wiki/Failover': {
    term: 'Failover',
    text: [
      'Switching automatically to a standby component when the active one fails, so the service keeps running. Typical examples are a backup server taking over a failed server’s IP address, or a replica database being promoted to master.',
    ],
  },
  'https://en.wikipedia.org/wiki/Microservices': {
    term: 'Microservices',
    text: [
      'An architecture that builds an application as a set of small services, each owning one business capability and its own data, deployed independently and talking over the network (usually HTTP or messaging).',
      'Teams can change and scale each service on its own; the price is more moving parts, network calls between services and harder debugging.',
    ],
  },
  'https://en.wikipedia.org/wiki/Service-oriented_architecture': {
    term: 'Service-oriented architecture (SOA)',
    text: [
      'An older, broader style in which an application is composed of reusable services that communicate over a network through well-defined contracts, often through a shared enterprise service bus. Microservices are a later, finer-grained take on the same idea.',
    ],
  },
  'https://en.wikipedia.org/wiki/Database_transaction': {
    term: 'Database transaction',
    text: [
      'A group of reads and writes that the database treats as one unit: either every change is applied or none is. Transactions are what let a bank transfer debit one account and credit another without ever showing a half-done state; relational databases describe their guarantees with ACID.',
    ],
  },
  'https://en.wikipedia.org/wiki/Multi-master_replication': {
    term: 'Multi-master replication',
    text: [
      'Replication in which more than one node accepts writes and the changes are copied between them. It keeps writes available if one master fails, but concurrent writes to the same data can conflict and must be resolved.',
    ],
  },
  'https://en.wikipedia.org/wiki/Shard_(database_architecture)': {
    term: 'Database shard',
    text: [
      'One horizontal slice of a database. Rows are split across several databases by a shard key (for example users A–M on one, N–Z on another), so each holds less data and serves less traffic.',
    ],
  },
  'https://en.wikipedia.org/wiki/PostgreSQL': {
    term: 'PostgreSQL',
    text: ['A widely used open-source relational database known for standards compliance, strong transactions and extensibility (custom types, indexes and extensions).'],
  },
  'https://en.wikipedia.org/wiki/Materialized_view': {
    term: 'Materialized view',
    text: [
      'The stored result of a query, kept in the database like a table. Reading it is fast because the work (such as a join or aggregation) was done in advance; the cost is keeping it up to date as the underlying tables change.',
    ],
  },
  'https://en.wikipedia.org/wiki/Denormalization': {
    term: 'Denormalization',
    text: [
      'Deliberately storing redundant copies of data, for example repeating a user’s name next to each of their posts, so reads avoid expensive joins. Writes get more complex because every copy must be updated.',
    ],
  },
  'https://en.wikipedia.org/wiki/B-tree': {
    term: 'B-tree',
    text: [
      'A balanced tree that keeps keys sorted and stores many keys per node, so lookups, inserts and range scans touch only a few nodes even for huge tables. It is the standard structure behind database indexes.',
    ],
  },
  'https://en.wikipedia.org/wiki/Lexicographical_order': {
    term: 'Lexicographic order',
    text: ['Dictionary order: keys are compared character by character, so "apple" comes before "apricot" and "user:10" before "user:9". Stores that keep keys in this order can answer range queries efficiently.'],
  },
  'https://en.wikipedia.org/wiki/Key-value_database': {
    term: 'Key-value database',
    text: ['A store that maps unique keys to values and offers little more than get, put and delete by key. Its simplicity makes it very fast and easy to partition; Redis and DynamoDB are common examples.'],
  },
  'https://en.wikipedia.org/wiki/Document-oriented_database': {
    term: 'Document database',
    text: ['A store whose records are self-describing documents (usually JSON-like), each of which can have its own fields and nested structure, and which can be queried by their contents. MongoDB and CouchDB are examples.'],
  },
  'https://en.wikipedia.org/wiki/Graph_database': {
    term: 'Graph database',
    text: ['A store built around nodes and the relationships (edges) between them, so following connections, such as friends of friends, is fast without joins. Neo4j is a well-known example.'],
  },
  'https://en.wikipedia.org/wiki/Cache_algorithms': {
    term: 'Cache invalidation and replacement',
    text: [
      'The rules a cache uses to decide which entries to drop: removing stale entries when the source changes (invalidation) and evicting entries when the cache is full (replacement policies such as least recently used).',
    ],
  },
  'https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)': {
    term: 'Least recently used (LRU)',
    text: ['An eviction policy: when the cache is full, drop the entry that has gone unused the longest. It is usually built from a hash map plus a doubly linked list so both lookups and updates take constant time.'],
  },
  'https://en.wikipedia.org/wiki/Exponential_backoff': {
    term: 'Exponential backoff',
    text: [
      'A retry strategy that waits longer after each failure, typically doubling the delay (1 s, 2 s, 4 s…) up to a cap, often with random jitter. It gives an overloaded service room to recover instead of being hammered by retries.',
    ],
  },
  'https://en.wikipedia.org/wiki/Little%27s_law': {
    term: 'Little’s law',
    text: [
      'For a stable system, the average number of items inside it equals the arrival rate times the average time each item spends there (L = λ × W). For example, 100 requests per second that each take 0.2 s means about 20 requests in flight at once.',
    ],
  },
  'https://en.wikipedia.org/wiki/Internet_Protocol': {
    term: 'Internet Protocol (IP)',
    text: ['The protocol that addresses and routes packets between networks. It delivers each packet on a best-effort basis: packets can be lost, duplicated or arrive out of order, which protocols such as TCP correct on top of it.'],
  },
  'https://en.wikipedia.org/wiki/Handshaking': {
    term: 'Handshake',
    text: ['An exchange of messages that sets up a connection before data flows. TCP’s three-way handshake (SYN, SYN-ACK, ACK) lets both sides agree on starting sequence numbers and confirm the other is reachable.'],
  },
  'https://en.wikipedia.org/wiki/Transmission_Control_Protocol#Checksum_computation': {
    term: 'TCP checksum',
    text: ['A value computed over each TCP segment’s header and data. The receiver recomputes it, and if the values differ the segment was corrupted in transit and is discarded, to be resent.'],
  },
  'https://en.wikipedia.org/wiki/Acknowledgement_(data_networks)': {
    term: 'Acknowledgement (ACK)',
    text: ['A message a receiver sends back to confirm data arrived. In TCP, a sender that does not receive an ACK in time assumes the data was lost and retransmits it.'],
  },
  'https://en.wikipedia.org/wiki/Flow_control_(data)': {
    term: 'Flow control',
    text: ['Keeping a fast sender from overwhelming a slow receiver. In TCP the receiver advertises how much buffer space it has left (the receive window), and the sender never has more unacknowledged data in flight than that.'],
  },
  'https://en.wikipedia.org/wiki/Network_congestion#Congestion_control': {
    term: 'Congestion control',
    text: ['Slowing down when the network itself is overloaded. TCP senders grow their sending rate gradually and cut it sharply when they see packet loss or delay, so many connections can share a link without collapsing it.'],
  },
  'https://en.wikipedia.org/wiki/Connection_pool': {
    term: 'Connection pooling',
    text: ['Keeping a set of open connections (to a database or another service) and reusing them across requests, instead of opening and closing a connection each time. It saves the setup cost and caps how many connections the server must handle.'],
  },
  'https://en.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol': {
    term: 'DHCP',
    text: ['The protocol that hands out IP addresses and network settings (gateway, DNS servers) automatically when a device joins a network. It runs over UDP, since the device has no address yet to hold a connection with.'],
  },
  'https://en.wikipedia.org/wiki/Transmission_Control_Protocol': {
    term: 'Transmission Control Protocol (TCP)',
    text: ['A connection-oriented protocol on top of IP that delivers a reliable, ordered stream of bytes, using handshakes, sequence numbers, acknowledgements, retransmission, flow control and congestion control.'],
  },
  'https://en.wikipedia.org/wiki/User_Datagram_Protocol': {
    term: 'User Datagram Protocol (UDP)',
    text: ['A connectionless protocol on top of IP that sends individual datagrams with no handshake, ordering or retransmission. It is lighter and lower-latency than TCP, and suits uses that tolerate loss, such as video calls, games and DNS.'],
  },
  'https://en.wikipedia.org/wiki/Cross-site_scripting': {
    term: 'Cross-site scripting (XSS)',
    text: ['An attack in which a site includes untrusted input in a page without escaping it, so an attacker’s script runs in other users’ browsers with the site’s privileges. Escaping output and a Content Security Policy are the main defences.'],
  },
  'https://en.wikipedia.org/wiki/SQL_injection': {
    term: 'SQL injection',
    text: ['An attack in which user input is pasted into a SQL query so it changes the query itself, for example to read or delete other users’ data. Parameterized queries, which send the input separately from the SQL, prevent it.'],
  },
  'https://en.wikipedia.org/wiki/Principle_of_least_privilege': {
    term: 'Principle of least privilege',
    text: ['Give every user, service and process only the permissions it needs for its job and nothing more, so a mistake or a breach in one place can do as little damage as possible.'],
  },
  'https://en.wikipedia.org/wiki/MD5': {
    term: 'MD5',
    text: ['A hash function that turns any input into a 128-bit value. It is fast and fine for spreading keys evenly or making short IDs, but it is broken for security: collisions can be produced on purpose, so it must not be used for passwords or signatures.'],
  },
  'https://en.wikipedia.org/wiki/Six_degrees_of_separation': {
    term: 'Degrees of separation',
    text: ['The number of friend-of-a-friend steps between two people. The popular idea of “six degrees” is that almost anyone can be reached in about six steps, which is why a search outward from a user reaches a huge part of a social graph quickly.'],
  },
  'https://en.wikipedia.org/wiki/Search_engine_indexing': {
    term: 'Reverse (inverted) index',
    text: ['The core structure of a search engine: for every word, a list of the documents that contain it. Answering a query means looking up its words and combining their lists, instead of scanning every document.'],
  },
  'https://en.wikipedia.org/wiki/Jaccard_index': {
    term: 'Jaccard index',
    text: ['A similarity score between two sets: the size of their intersection divided by the size of their union, from 0 (nothing in common) to 1 (identical). Comparing the sets of words or shingles in two pages this way detects near-duplicates.'],
  },
  'https://en.wikipedia.org/wiki/Cosine_similarity': {
    term: 'Cosine similarity',
    text: ['A similarity score between two vectors, such as word-count vectors of two documents: the cosine of the angle between them. It is 1 when they point the same way, regardless of length, so two pages with the same word mix score high even if one is longer.'],
  },
}
