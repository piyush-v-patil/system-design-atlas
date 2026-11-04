# System Design Atlas: Step 0 plan

Status: **approved** (D1–D5 as recommended). Phases 1–2 complete; see the Phase log at the end.

Source: `./source` is a fresh clone of `donnemartin/system-design-primer` at commit
`ae9bbd7` ("Fix link for UDP vs TCP (#1153)"). This fork's root is at the same commit.

License confirmed: `source/LICENSE.txt` says *"Copyright 2017 Donne Martin. Creative
Commons Attribution 4.0 International License (CC BY 4.0)
http://creativecommons.org/licenses/by/4.0/"*.

---

## 1. What I read, in numbers

| Source | Contents |
|---|---|
| `README.md` | 1,840 lines, **172 headings** (H1 ×1, H2 ×29, H3 ×82, H4 ×33, H5 ×24, H6 ×3), 89 internal `#anchor` links (all resolve), 325 unique external URLs, 35 local images + 1 remote image |
| `solutions/system_design/*/README.md` | 8 problems, each with Step 1–4 + "Additional talking points". Images are **remote imgur URLs**; local copies exist in each folder (see §6) |
| `solutions/object_oriented_design/*/*.ipynb` | 6 notebooks, each with 5 cells: credit line, H1 title, "Constraints and assumptions", "Solution", and one code cell (`%%writefile x.py`) |
| `resources/flash_cards/*.apkg` | 3 Anki decks (SQLite inside a zip): System Design (42 cards), System Design Exercises (8), OO Design (6). Basic Front/Back model, HTML backs, no bundled media |
| `resources/study_guide.png` | Same picture as `images/OfVllex.png` |
| Total unique external URLs | **410** across README + solutions + notebooks |

---

## 2. Full topic tree (every README heading)

Area tags: **F** fundamentals · **N** networking · **D** data · **C** caching ·
**A** async · **M** communication · **S** security · **X** appendix · **G** guide (see decision D2)

Topic IDs are GitHub-style slugs (`github-slugger`), so every existing `#anchor` in the
Primer resolves unchanged. Repeated headings get `-1`, `-2` suffixes, exactly as GitHub
does (e.g. `sources-and-further-reading-3`).

```
The System Design Primer
  · [G] Motivation
    · Learn how to design large-scale systems
    · Learn from the open source community
    · Prep for the system design interview
  · [G] Anki flashcards
    · Coding Resource: Interactive Coding Challenges
  · [G] Contributing
  · [G] Index of system design topics
  · [G] Study guide
  · [G] How to approach a system design interview question
    · Step 1: Outline use cases, constraints, and assumptions
    · Step 2: Create a high level design
    · Step 3: Design core components
    · Step 4: Scale the design
    · Back-of-the-envelope calculations
    · Source(s) and further reading
  · [G] System design interview questions with solutions
    · Design Pastebin.com (or Bit.ly)
    · Design the Twitter timeline and search (or Facebook feed and search)
    · Design a web crawler
    · Design Mint.com
    · Design the data structures for a social network
    · Design a key-value store for a search engine
    · Design Amazon's sales ranking by category feature
    · Design a system that scales to millions of users on AWS
  · [G] Object-oriented design interview questions with solutions
  · [F] System design topics: start here
    · Step 1: Review the scalability video lecture
    · Step 2: Review the scalability article
    · Next steps
  · [F] Performance vs scalability
    · Source(s) and further reading
  · [F] Latency vs throughput
    · Source(s) and further reading
  · [F] Availability vs consistency
    · CAP theorem
      · CP - consistency and partition tolerance
      · AP - availability and partition tolerance
    · Source(s) and further reading
  · [F] Consistency patterns
    · Weak consistency
    · Eventual consistency
    · Strong consistency
    · Source(s) and further reading
  · [F] Availability patterns
    · Fail-over
      · Active-passive
      · Active-active
    · Disadvantage(s): failover
    · Replication
      · Master-slave and master-master
    · Availability in numbers
      · 99.9% availability - three 9s
      · 99.99% availability - four 9s
      · Availability in parallel vs in sequence
          · In sequence            (H6 directly under H4 in the source)
          · In parallel            (H6 directly under H4 in the source)
  · [N] Domain name system
    · Disadvantage(s): DNS
    · Source(s) and further reading
  · [N] Content delivery network
    · Push CDNs
    · Pull CDNs
    · Disadvantage(s): CDN
    · Source(s) and further reading
  · [N] Load balancer
    · Layer 4 load balancing
    · Layer 7 load balancing
    · Horizontal scaling
      · Disadvantage(s): horizontal scaling
    · Disadvantage(s): load balancer
    · Source(s) and further reading
  · [N] Reverse proxy (web server)
    · Load balancer vs reverse proxy
    · Disadvantage(s): reverse proxy
    · Source(s) and further reading
  · [N] Application layer
    · Microservices
    · Service Discovery
    · Disadvantage(s): application layer
    · Source(s) and further reading
  · [D] Database
    · Relational database management system (RDBMS)
      · Master-slave replication
        · Disadvantage(s): master-slave replication
      · Master-master replication
        · Disadvantage(s): master-master replication
        · Disadvantage(s): replication
        · Source(s) and further reading: replication
      · Federation
        · Disadvantage(s): federation
        · Source(s) and further reading: federation
      · Sharding
        · Disadvantage(s): sharding
        · Source(s) and further reading: sharding
      · Denormalization
        · Disadvantage(s): denormalization
          · Source(s) and further reading: denormalization   (H6 in the source)
      · SQL tuning
        · Tighten up the schema
        · Use good indices
        · Avoid expensive joins
        · Partition tables
        · Tune the query cache
        · Source(s) and further reading: SQL tuning
    · NoSQL
      · Key-value store
        · Source(s) and further reading: key-value store
      · Document store
        · Source(s) and further reading: document store
      · Wide column store
        · Source(s) and further reading: wide column store
      · Graph database
        · Source(s) and further reading: graph
      · Source(s) and further reading: NoSQL
    · SQL or NoSQL
        · Source(s) and further reading: SQL or NoSQL       (H5 directly under H3)
  · [C] Cache
    · Client caching
    · CDN caching
    · Web server caching
    · Database caching
    · Application caching
    · Caching at the database query level
    · Caching at the object level
    · When to update the cache
      · Cache-aside
        · Disadvantage(s): cache-aside
      · Write-through
        · Disadvantage(s): write through
      · Write-behind (write-back)
        · Disadvantage(s): write-behind
      · Refresh-ahead
        · Disadvantage(s): refresh-ahead
    · Disadvantage(s): cache
    · Source(s) and further reading
  · [A] Asynchronism
    · Message queues
    · Task queues
    · Back pressure
    · Disadvantage(s): asynchronism
    · Source(s) and further reading
  · [M] Communication
    · Hypertext transfer protocol (HTTP)
      · Source(s) and further reading: HTTP
    · Transmission control protocol (TCP)
    · User datagram protocol (UDP)
      · Source(s) and further reading: TCP and UDP
    · Remote procedure call (RPC)
      · Disadvantage(s): RPC
    · Representational state transfer (REST)
      · Disadvantage(s): REST
    · RPC and REST calls comparison
      · Source(s) and further reading: REST and RPC
  · [S] Security
    · Source(s) and further reading
  · [X] Appendix
    · Powers of two table
      · Source(s) and further reading
    · Latency numbers every programmer should know
      · Latency numbers visualized
      · Source(s) and further reading
    · Additional system design interview questions
    · Real world architectures
    · Company architectures
    · Company engineering blogs
      · Source(s) and further reading
  · [X] Under development
  · [G] Credits
  · [G] Contact info
  · [G] License
```

Plus a **preamble node** for the content above the H1 (the language bar and "Help
translate this guide!"), so that content isn't dropped.

**Parenting rule:** a heading's parent is the nearest preceding heading with a smaller
depth. The tree follows the source's heading levels literally. Where the Primer's
*Index* section groups things differently, I add cross-links instead of moving nodes
(e.g. the Index lists Active-passive/Active-active under *Load balancer*, but their
headings live under *Availability patterns › Fail-over*).

### Solution trees (one JSON file each, 4-step structure kept)

Every solution has the same skeleton: H1 title, intro note, `## Step 1: Outline use
cases and constraints` (Use cases / Out of scope / State assumptions / Calculate usage),
`## Step 2: Create a high level design` (one image), `## Step 3: Design core components`
(one H3 per use case), `## Step 4: Scale the design` (one image + discussion), and
`## Additional talking points`. The Step 3 sub-sections differ per problem:

| Problem | Step 3 sections | Step 4 notes |
|---|---|---|
| pastebin | create paste; view paste; analytics; delete expired | |
| twitter | post tweet; home timeline; user timeline; search | |
| web_crawler | crawl URLs; handling duplicates; when to update; search | |
| mint | connect account; extract transactions (+ Category service); recommend budget | |
| social_graph | shortest-path search | |
| query_cache | cache hit (+ Cache implementation, When to update the cache) | + "Expanding the Memory Cache to many machines" |
| sales_rank | compute weekly popular products; view popular products | |
| scaling_aws | single box, SQL vs NoSQL, static IP, DNS, secure web server | **five sub-stages: Users+, Users++, Users+++, Users++++, Users+++++**, each with its own image |

---

## 3. Visual treatment per topic, by content type

Every card always has the same three layers: map node → visual card → **Original**
panel (expandable, full source markdown rendered with images, code, tables and links).
"Disadvantage(s)" and "Source(s) and further reading" headings are real nodes. They show
as small satellite dots on the map and as their own cards. Their content also feeds the
parent card's "cons" and "further reading" strips.

### 3a. Trade-off comparison cards (side by side, with a "choose when" row)

| Comparison | Card lives on | "Choose when" comes from |
|---|---|---|
| CP vs AP | CAP theorem | quoted: "atomic reads and writes" / "allow for eventual consistency… continue working despite external errors" |
| Weak vs eventual vs strong consistency | Consistency patterns | quoted: VoIP/video/games · DNS/email/highly available · file systems/RDBMS/transactions |
| Active-passive vs active-active | Fail-over | paraphrased (hot/cold standby, DNS/app logic must know both) |
| Master-slave vs master-master | Replication / RDBMS | paraphrased from the two sections + their disadvantage lists |
| L4 vs L7 load balancing | Load balancer | quoted: L4 "less time and computing resources", L7 video vs billing routing |
| Push vs pull CDN | CDN | quoted: "small amount of traffic / not often updated" vs "heavy traffic" |
| Horizontal vs vertical scaling | Horizontal scaling | paraphrased |
| Load balancer vs reverse proxy | Load balancer vs reverse proxy | quoted bullets |
| SQL vs NoSQL | SQL or NoSQL | quoted "Reasons for SQL/NoSQL" + "Sample data well-suited for NoSQL" |
| Key-value vs document vs wide-column vs graph | NoSQL | the "Abstraction:" line + use-case sentence from each section |
| Cache-aside vs write-through vs write-behind vs refresh-ahead | When to update the cache | paraphrased from each section (flagged where inferred, see §7) |
| Message queue vs task queue | Asynchronism | paraphrased |
| TCP vs UDP | Communication | quoted "Use TCP over UDP when" / "Use UDP over TCP when" |
| RPC vs REST | RPC and REST calls comparison | quoted; includes the Primer's 7-row call comparison table as a diff view |
| Performance vs scalability, latency vs throughput | their own cards | quoted one-liners |
| In sequence vs in parallel | Availability in parallel vs in sequence | formulas, wired to the calculator |

Each "choose when" / "use when" value in `content/visuals/*.ts` carries a
`basis: 'quoted' | 'paraphrased'` field and the source line range. Paraphrased ones get
a small "paraphrased" marker in the UI, so you can review them.

### 3b. Animated processes (SVG + Play / Step / Reset, each step highlights its source line)

| Process | Steps (taken from the source text) |
|---|---|
| Cache-aside | the 4 bullets: cache miss → load from DB → add to cache → return (plus the Python snippet, line-highlighted in sync) |
| Write-through | the 3 bullets: app writes to cache → cache synchronously writes to DB → return |
| Write-behind | the 2 bullets: write to cache → asynchronous write to DB (shows the data-loss window) |
| Refresh-ahead | TTL timeline: an entry that was accessed recently gets refreshed before it expires |
| Active-passive failover | heartbeats → heartbeat interrupted → passive takes over active's IP; hot vs cold standby toggle |
| Active-active | both serve traffic; public-facing (DNS knows both IPs) vs internal-facing (app logic) toggle |
| Master-slave replication | write → master → replicate to slaves (tree fan-out) → reads from slaves → master offline → read-only → promote |
| Master-master replication | both accept writes and coordinate; one master down → the other keeps reading and writing |
| DNS lookup | follows the Primer's image (client → ISP resolver miss → asks another server → caches → returns IP), plus a TTL cache-expiry step (see flag F6) |
| Pull vs push CDN | first request misses and pulls from origin, then TTL; vs upload-on-change |
| Load balancer routing | requests distributed by random / least loaded / session / round robin / weighted (selector); unhealthy server is skipped |
| Federation | queries routed by function to forums / users / products databases |
| Sharding | users routed by last-name initial or by geography; a "power user" hot-shard toggle |
| Message queue | publish job → notify user → worker picks up → signal complete (tweet example) |
| Task queue | task + data in → run → result out, with a scheduling lane |
| Back pressure | queue grows → cap reached → HTTP 503 → client retries with exponential backoff |
| TCP vs UDP | sequence numbers, ACKs and retransmission vs datagrams arriving out of order or dropped |
| RPC call | the 5 bullets: client program → client stub (marshal) → client comm module → server comm module → server stub (unmarshal), then the reverse |

### 3c. Numbers and interactive tools

- **Availability calculator** (on *Availability in numbers* and its children): add
  components, group them in series or parallel (nested groups allowed), and see the
  combined availability and downtime per year, month, week and day. Unit tests check it
  against the Primer's 99.9% and 99.99% tables and its two worked examples (99.8% in
  series, 99.9999% in parallel). See flag **F1**: one cell in the Primer's table doesn't
  match the arithmetic.
- **Latency numbers**: a log-scale bar chart of the 14 rows, with a "scale to human time"
  toggle (1 ns → 1 s), plus the "handy metrics" as derived callouts. The Primer's
  "Latency numbers visualized" image stays in the Original layer.
- **Powers-of-two converter**: type a power, a byte count or a unit to get exact value,
  approximate value and bytes; the Primer's 8 rows are highlighted.
- **Back-of-the-envelope helper** (used by the solution builders): uses the Primer's own
  conversion guide (2.5M seconds per month, 400 req/s = 1B req/month).

### 3d. Anatomy and structure diagrams (static SVG with hover/click hotspots)

Domain name system (NS/MX/A/CNAME record types, routing methods) · Reverse proxy (the
benefits as callouts on the proxy box) · Application layer (web layer vs application
layer, workers) · Microservices (the Pinterest example services) · Service discovery
(registry, health checks, KV config) · RDBMS (ACID badges; scaling-techniques hub) ·
NoSQL (BASE badges; one mini data-model drawing per store: hash table, document, nested
`ColumnFamily<RowKey, Columns<ColKey, Value, Timestamp>>`, property graph) · Denormalization
(normalized join vs duplicated rows; the 100:1 read/write ratio) · SQL tuning (checklist
with the 5 sub-areas) · Cache (where a cache can sit: client → CDN → web server → app →
DB, clickable down to the 5 location cards) · Caching at the query level vs object level
· Communication (OSI layers, with L4 and L7 linked to the load balancer cards) · HTTP
(verb × idempotent/safe/cacheable matrix) · REST (the 4 qualities) · Security (checklist
of the 4 basics).

### 3e. Reference and list content (filterable grids, no invented diagrams)

Additional system design interview questions (table → searchable cards) · Real world
architectures (filter by Data processing / Data store / File system / Misc) · Company
architectures (company grid) · Company engineering blogs (grid) · every "Source(s) and
further reading" node (link list with domain chips) · Under development · Credits ·
Contact info · License · Anki flashcards · Coding resource · Contributing.

### 3f. Guide nodes

- *Index of system design topics* → "open the map" (the map *is* the index), with the
  original index list in the Original layer.
- *Study guide* → links to the **Study path** view.
- *How to approach…* and its Steps 1–4 → a 4-step stepper. Each step links to that
  step in all 8 builders.
- *System design interview questions with solutions* and its 8 children → gallery
  cards that open the builders.
- *Object-oriented design interview questions* → gallery of the 6 OOD pages, plus the
  "circular array" row as a listed-but-unsolved item, as in the source.
- Motivation, Next steps, the scalability lecture and article steps → simple cards with
  the key quote and the link.

### 3g. The 8 system design builders

Each builder is a 4-step architecture canvas with the original solution text in a
side-by-side column (stacked on phones):

1. **Requirements and math**: use-case / out-of-scope chips, and the assumptions with
   each "Calculate usage" figure recomputed live from its inputs, shown next to the
   Primer's stated value.
2. **High-level design**: the boxes and arrows from the `*_basic.png` diagram, redrawn
   as SVG.
3. **Core components**: one tab per Step 3 use case. Each tab animates the request path
   from that section's bullets ("Client → Web Server → Write API → SQL + Object Store").
4. **Scale the design**: adds the components from the final diagram (DNS, CDN, load
   balancer, more web servers, memory cache, read replicas, master-slave pair, NoSQL,
   analytics DB, queues). New components are highlighted, and each one links to its topic
   card. **scaling_aws** gets five sub-steps (Users+ … Users+++++), each matching its own
   image.

I'll transcribe component layout and edges from the original PNGs, and keep the
original images in the Original layer for comparison.

### 3h. OOD pages (6)

Class diagram (SVG, UML-style: classes, enums, abstract classes, methods, inheritance)
next to the original notebook code. Clicking a class highlights its lines in the code.
Classes, methods and inheritance are **extracted automatically** from the code.
Associations (has-a arrows) are **hand-curated** and marked as such.

---

## 4. Content pipeline

```
source/ (read-only)
  └─ scripts/build-content.ts  (tsx; unified + remark-parse + remark-gfm + github-slugger)
       ├─ content/topics.json          one node per README heading + preamble
       ├─ content/solutions/<id>.json  8 files, 4-step structure + talking points
       ├─ content/ood/<id>.json        6 files: markdown cells + code + outputs (+ .py variant)
       ├─ content/flashcards.json      from the .apkg decks (sql.js) + generated cards
       ├─ content/images.json          manifest: original ref → local path, alt, caption, credit
       ├─ content/search-index.json    MiniSearch index over all text
       └─ public/images/**             copied from source/images and solution folders
content/visuals/<topic-id>.ts          hand-written: diagram type, pros/cons, use-when, related
```

**Topic node shape**

```ts
{ id, title, depth, order, area, parentId, childIds, headingPath: string[],
  markdown,            // raw source slice for this heading's own body (byte-exact)
  sourceLines: [start, end], urls: string[], images: string[] }
```

**Lossless guarantee:** the markdown is sliced from the source by AST position offsets,
not re-serialized. A pipeline test re-concatenates preamble + every heading line + every
body slice and asserts the result is **byte-identical** to `README.md`. The same check
runs for each solution README.

**Link handling in the Original layer:** in-page `#anchors` and links to
`github.com/donnemartin/system-design-primer#…` are rewritten to in-app routes, and
`solutions/…/README.md` and `.ipynb` links go to builder and OOD pages. Every rewritten
link keeps the original URL in `data-source-href` and a "view on GitHub" affordance. Other
relative links (`CONTRIBUTING.md`, `TRANSLATIONS.md`, `README-ja.md`, etc.) point to the
file on GitHub at the pinned commit.

**Raw HTML** in the README (`<p align="center"><img>`, `<sup><a href=…>`, `<i>`, `<br/>`)
is rendered with `rehype-raw` plus `rehype-sanitize`, using an allowlist schema for only
these tags. Code blocks use build-time syntax highlighting. `:+1:` uses `remark-gemoji`.

---

## 5. Coverage test (`tests/coverage.test.ts`)

Runs in Vitest against the generated content **and** against server-rendered HTML
(`react-dom/server`) of every card's Original layer, builder page and OOD page.

1. **Headings**: re-parses `source/README.md` independently, and asserts each heading has
   a node whose ancestry chain reaches the map root through the same data the D3 map
   consumes.
2. **URLs**: collects every URL from the markdown AST plus raw-HTML `href`/`src` in
   README, the 8 solutions and the 6 notebooks (410 unique), and asserts each one
   appears in rendered output, either as an `href` or as the `data-source-href` of a
   rewritten link.
3. **Images**: every image reference (markdown and `<img>`) is rendered as an `<img>`
   whose `src` resolves to a file that exists in `public/images`. Its caption and
   source credit are rendered too.
4. **Pages**: every solution and OOD problem has a route that renders without error.
5. **Lossless**: the byte-identical reconstruction check from §4.

On failure it prints a grouped list of everything missing (heading paths, URLs with their
source file and line, image refs, routes).

---

## 6. Images

- **35 files in `source/images/`** are copied as-is and keep the same names.
- **Solution READMEs reference imgur URLs.** I matched each one to a local file by
  downloading the imgur original and comparing dimensions and content:
  - the final diagrams (`4edXG0T`, `jrUBAF7`, `bWxPtQA`, `V5q57vU`, `cdCv5g7`,
    `4j99mhe`, `MzExP06`, `jj3A5N8`) are in `images/`
  - the basic diagrams (`BKsBnmG`, `48tEA2j`, `xjdAAUv`, `E8klrBh`, `wxXyq2J`,
    `KqZ3dSx`, `vwMa1Qu`) are the `*_basic.png` files
  - the scaling_aws stages map as `B8LDKD7`=`_1`, `rrfjMXB`=`_2`, `raoFTXM`=`_3`,
    `OZCxJr0`=`_4`, `3X8nmdL`=`_5`, `jj3A5N8`=`_7`
  - `scaling_aws_6.png` and `scaling_aws.png` aren't referenced anywhere. I'll still
    copy them and show them in an "unreferenced source images" strip on that builder.
  - `BKsBnmG` (imgur) is 848×934 and `pastebin_basic.png` is 790×888: same drawing,
    different padding. I'll use the local file.
- **"Latency numbers visualized"** is a `camo.githubusercontent.com` URL that decodes to
  `http://i.imgur.com/k0t1e.png`. It isn't in the repo, and camo returns 403 from here,
  but imgur serves it. I'll vendor it once into `public/images/remote/k0t1e.png` and
  record its origin in `images.json`.
- Captions and credits come from the `<i><a href=…>Source: …</a></i>` line inside each
  `<p align="center">` block. Images without one (the README hero images and the solution
  diagrams) are credited to the Primer.

---

## 7. Accuracy flags (things I won't silently "fix")

- **F1: Availability table typo.** The 99.99% row says *downtime per week 1m 5s*, but
  0.0001 × 604,800 s = **60.48 s, which is 1m 0.5s**. Every other cell matches a
  365.25-day year (for example, 8h 45min 57s per year at 99.9%). The calculator will
  show the computed value with a note. The Original layer keeps the source text as is.
- **F2: Latency ratio mismatch.** All 8 solutions repeat the same sentence: reading 1 MB
  from SSD is 4× and from disk **80×** slower than memory. For example, see
  `pastebin/README.md:119` and `scaling_aws/README.md:240`. The README's
  latency table gives HDD 30 ms vs memory 250 µs, which is **120×**. I'll show both,
  attributed, and change neither.
- **F3: Index vs headings.** The Index places Active-passive/Active-active under *Load
  balancer*. It also omits HTTP and "RPC and REST calls comparison", and writes "Service
  discovery" where the heading says "Service Discovery". The map follows the headings and
  adds cross-links.
- **F4: Odd heading levels.** "In sequence" and "In parallel" are H6 under an H4. The
  denormalization reading list is H6 under an H5. "Source(s)…: SQL or NoSQL" is H5 under
  an H3. "Disadvantage(s): replication" sits under *Master-master* by level, but its text
  says it applies to both. I keep the literal tree and add a "related" link from
  master-slave.
- **F5: Refresh-ahead mentions "read-through"**, which the Primer never defines. I won't
  invent a read-through explanation. The card will only quote the sentence.
- **F6: The DNS image is simplified.** In it, the *root* server answers with the IP from
  its cache. Real resolution goes root → TLD → authoritative. The README text doesn't
  describe the steps either way. My plan is to animate the Primer's picture as drawn, and
  optionally add a clearly labelled "beyond the Primer" note. Tell me if you'd rather leave
  it out.
- **F7: Flashcard decks are 2017 snapshots.** Their text has drifted from the current
  README, and one card uses an image (`imgur p7xHS4Z.png`, reverse proxy) that isn't in
  the repo. See decision D4.
- **F8: Notebook vs `.py` drift.** In 5 of 6 OOD problems the notebook code differs from
  the sibling `.py`: stubs written `# ...` vs `pass`, `NotImplemented` vs
  `NotImplementedError`, and small refactors. The README links to the notebooks, so they
  are canonical. The `.py` will be shown in a second tab, so both are kept.
- **F9: Title mismatches.** The README says "Design a key-value store for a search engine"
  but the solution's H1 is "Design a key-value cache to save the results of the most
  recent web server queries". The Twitter title also drops "(or Facebook feed and
  search)". Builder pages will show both titles.
- **F10: Terminology.** I'll keep the source's "master/slave" wording in visuals so they
  match the text exactly, with a small "a.k.a. primary/replica" note on those cards.
- I recomputed the "Calculate usage" maths in all 8 solutions and it's consistent with
  the stated assumptions.

---

## 8. Tech stack

| Concern | Choice |
|---|---|
| Build / app | Vite 6, React 18, TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), CSS variables for light/dark themes, `prefers-color-scheme` + toggle |
| Map | `d3-hierarchy` (radial tree/cluster), `d3-zoom`, `d3-selection`, rendered into React-owned SVG |
| Diagrams | Hand-built React SVG components plus a small shared kit (Box, Cylinder, Queue, Arrow, Packet, Highlight) and a `useStepper` hook for Play/Step/Reset |
| Original layer | `react-markdown` + `remark-gfm` + `remark-gemoji` + `rehype-raw` + `rehype-sanitize` + `rehype-slug`; code highlighting at build time with Shiki |
| Routing | `react-router` with `HashRouter`, so it works on GitHub Pages with no 404 hacks |
| Search | MiniSearch, index prebuilt at build time; Cmd/Ctrl+K command palette |
| Flashcards | `sql.js` at build time only, to read `.apkg`; progress and Leitner boxes in `localStorage` |
| Tests | Vitest + `@testing-library/react` + `react-dom/server` |
| Scripts | `tsx` to run the TypeScript build scripts |
| Deploy | Static `dist/`; GitHub Actions workflow for Pages, plus `vercel.json` |

---

## 9. Folder structure

```
/
├─ source/                     pristine Primer @ ae9bbd7 (git submodule, never modified)
├─ scripts/
│  ├─ build-content.ts         orchestrates everything below
│  ├─ readme.ts  solutions.ts  ood.ts  flashcards.ts  images.ts  search.ts
│  └─ util/  (slug, sections, urls, html-blocks)
├─ content/                    generated JSON (committed so diffs are reviewable)
│  ├─ topics.json  images.json  flashcards.json  search-index.json
│  ├─ solutions/*.json  ood/*.json
│  └─ visuals/<topic-id>.ts    hand-written metadata only (+ index.ts registry)
├─ public/images/              copied images (+ solutions/<problem>/, remote/)
├─ src/
│  ├─ app/                     App shell, router, theme, footer (attribution)
│  ├─ map/                     RadialMap, legend, zoom controls
│  ├─ card/                    TopicCard, OriginalPanel, Breadcrumbs, PrevNext
│  ├─ visuals/                 ComparisonCard, ProcessPlayer, diagram kit, per-topic diagrams
│  ├─ tools/                   AvailabilityCalculator, LatencyScale, PowersOfTwo, Envelope
│  ├─ builders/                ArchitectureBuilder + problems/<id>.ts layouts
│  ├─ ood/                     ClassDiagram, CodePane
│  ├─ features/                flashcards/, study-path/, search/, progress/
│  └─ lib/                     content loaders, storage (safe localStorage), a11y helpers
├─ tests/  coverage.test.ts  pipeline.test.ts  availability.test.ts  ...
├─ .github/workflows/deploy.yml
├─ index.html  vite.config.ts  tsconfig.json  package.json  vercel.json
└─ README.md                   the Atlas's own README (attribution + how to build)
```

---

## 10. UX summary

- **Home is the map.** Radial, zoomable, coloured by area. Satellites (Disadvantages,
  Sources) are smaller and fade in as you zoom. Clicking a node opens its card in a side
  panel; on phones the card is a bottom sheet.
- **Card**: breadcrumbs from the heading path; visual(s); pros vs cons; "use when";
  related links; the **Original** panel; Prev/Next in README order.
- **Study path** recreates the Primer's short/medium/long table as a visual checklist,
  together with the study-guide diagram as SVG. Checkboxes tie into progress.
- **Progress**: a topic is marked read when its card opens. Read nodes get a ring on the
  map, and each area shows its percentage.
- **Search**: Cmd/Ctrl+K searches all topic, solution, OOD and flashcard text, and jumps to
  the matching card.
- **Footer** on every page: *"An adapted visual edition of The System Design Primer by
  Donne Martin and contributors, licensed CC BY 4.0"*, with links to the repo and the
  license, and a note that changes were made. Per-image credits stay on each image.

---

## 11. Decisions I need from you

- **D1: Repo layout.** This repo is a fork of the Primer, so its root already holds the
  Primer's files (`README.md`, `images/`, `solutions/`, translations…). Options:
  - (a) **Recommended.** Make the root the Atlas app. Remove the forked Primer files from
    the root, since they're preserved byte-identical in `./source`, pinned as a **git
    submodule** at `ae9bbd7`. Replace the fork's `.gitignore`, which ignores `lib/` and
    `dist/` and would swallow `src/lib/`.
  - (b) Keep the forked files at the root and put the app in `./atlas/`. That gives two
    copies of the Primer and paths like `atlas/source`.
  - (c) Keep everything at the root side by side. `README.md` would collide.
- **D2: Area for the meta sections.** Motivation, Anki, Contributing, Index, Study guide,
  How to approach, the solutions lists, OOD, Credits, Contact and License don't fit your
  eight areas. I propose a **ninth neutral "guide"** colour. The alternative is folding
  them into *appendix*.
- **D3: Area for "Application layer".** I put it in *networking* (it sits in the
  request-serving chain with DNS, CDN, LB and reverse proxy). The alternative is
  *fundamentals*.
- **D4: Flashcards.** Recommended: (a) import the **56 Anki cards** as the "Primer
  decks", with their HTML sanitized and inline styles stripped, and labelled as 2017
  snapshots; and (b) add **generated cards** from the current README. Those would be
  heading → section recall, every `**Term** - definition` bullet, and every
  Disadvantage(s) list, each linking back to its source node. Alternatively, generated
  cards only.
- **D5: Out-of-scope translations.** I'll render only the English README. The
  `README-ja`, `zh-Hans` and `zh-TW` files and the translated solution READMEs would be
  linked, not parsed. They contain no unique English content, but they do contain URLs.
  The coverage test's URL rule covers README.md, the solutions and the notebooks, as you
  specified.

Once you approve (and answer D1–D5), I'll start **Phase 1**: pipeline, coverage test,
map, and a generic card with the Original layer only.

---

## Phase log

### Phase 1: pipeline, coverage test, map, generic card

- **Repo layout (D1):** the forked Primer files were removed from the root. The Primer lives only in `./source`
  as a submodule at `ae9bbd7`. The `.gitignore` was replaced.
- **Versions:** latest stable at build time: React 19 (the plan said 18), Vite 8, Vitest 5, TypeScript 7,
  Tailwind 4, react-router 7.
- **Map:** a radial dendrogram. Leaves sit on one outer ring and internal nodes on rings by level. H2 names and
  area bands sit on the rim. Leaf labels appear when you zoom in; internal labels appear when you zoom in
  further, or when the node is on the hovered or selected path. Outline view is the keyboard and screen-reader
  equivalent.
- **Coverage:** 172/172 headings, 203/203 solution headings, 583/583 URL checks (573 unique: external URLs,
  anchors, relative links, image paths and URLs inside code), 57/57 images with credits, and 14/14 pages.
  A mutation check (deleting a heading, an image and a URL from the generated content) made the test fail with
  the expected list.
- **F11 (new, rendering):** three inline links are written as `<sup><a href=URL>1</a></sup>` with an unquoted
  `href` (README lines 414 and 787, plus a line in each solution). GitHub renders them, but micromark does not
  treat them as inline HTML, so they showed as literal text. The coverage test caught this. They are fixed at
  render time by quoting the attribute (`src/lib/markdown-fixups.ts`). The stored source is unchanged.
- **Code highlighting:** only `python` fences are highlighted, at build time with Shiki. Unlabelled fences stay
  plain because the source doesn't state their language.
- **Bundle:** the content JSON is bundled eagerly (about 345 KB gzipped in total). It will be code-split in
  Phase 5.

### Phase 2: visual cards for the core topics

- **Name:** the app keeps the repo's name, *System Design Atlas*.
- **Visual kit** (`src/visuals/kit`): themed SVG nodes (server, database cylinder, cache, client, load
  balancer, app, DNS, queue), wires, animated packets, and Play/Back/Step/Reset controls. The active step is
  highlighted in the step list, in the Primer's code (cache-aside and write-through), and in the Original text
  (via the CSS Custom Highlight API). The kit also has comparison tables with a "choose when" row, pros/cons,
  "use when", notes, and related topics. A "wide" toggle widens the card.
- **32 topic cards** with metadata in `content/visuals/*.ts`:
  - CAP, CP and AP: partition simulation with CP/AP modes.
  - Consistency patterns: weak, eventual and strong replication.
  - Availability patterns: a four-pattern comparison.
  - Fail-over, active-passive and active-active: heartbeats, IP takeover, and a hot/cold standby toggle.
  - Replication: master-slave (including tree replication and promotion) and master-master (load balancer,
    conflict, failure).
  - Availability calculator: nested series/parallel groups, a live block diagram, and downtime per period. The
    99.9% and 99.99% tables are shown computed vs the Primer.
  - Load balancer: live routing simulation (Random, Least loaded, Session/cookies, Round robin, Weighted round
    robin; unhealthy servers and weights adjustable).
  - L4 vs L7: what each layer reads, NAT vs terminating the connection, and content-based routing.
  - Horizontal vs vertical scaling.
  - Federation and sharding: shard by initial or by geography, a hot shard, a failed shard, and rebalancing with
    a count of moved users.
  - The four cache strategies, plus small diagrams of each one's data paths.
- **Accuracy:** `tests/visuals.test.ts` checks that all **527 quoted claims** appear verbatim within their cited
  README lines. The **61 paraphrases** are marked ≈ in the UI and cite their lines. The calculator maths is
  tested against the Primer's tables and examples (`tests/availability.test.ts`).
- **F12 (new): write-behind text vs diagram.** The Primer's text says "the application" asynchronously writes to
  the data store. Its diagram (`rgSrvjG`) shows the cache adding an event to a queue, which an event processor
  then writes to the DB. The animation follows the diagram's four numbered steps, and a note on the card says so.
- **F13 (new): sharding diagram vs text.** The sharding diagram (`wU8x5Id`) routes through a box labelled
  "Load balancer". The text says application logic must work with shards. The visual follows the text.
- **Labels kept to the source:** the L7 node says "terminates traffic", following the Primer's wording, rather
  than naming TCP. Weighted round robin weights and the sample users in the sharding visual are illustrative,
  and the UI labels them that way.
- **Fixed during review:**
  - Duplicate sibling React keys left old visuals in the DOM after navigating between cards.
  - The Play button was invisible because two background classes conflicted.

### Map revision (after Phase 2 review)

- **New default "Focus" view.** The selected topic sits in the centre, its children branch out mind-map style
  with horizontal labels, and its grandchildren appear beyond them when they fit at a readable size; otherwise
  they collapse into "+N" pills. A parent node and a breadcrumb trail lead back up. Selecting a leaf centres its
  parent, so its siblings stay in view.
- **Layout by width.** Wide panes branch both ways. Narrow panes and phones branch one way, at a minimum readable
  scale, and you drag to pan.
- **Shorter satellite labels.** Under a parent, satellites read "Disadvantages" and "Further reading".
- The radial dendrogram stays available as **Whole map**, next to **Outline**.
- **Coverage test:** "reachable from the map" now means each heading is drawn in the Focus view when its parent
  is focused, i.e. one click from its parent.

### Phase 3: visual cards for every remaining topic

- **Every one of the 172 topics now has a visual card** (`tests/visuals.test.ts` enforces this).
- **Learning path (new).** This answers "what should I study, and when?". `/path` lays out 10 stages in the
  Primer's own order: its "start here" section, then "high-level trade-offs", then "DNS, CDNs, and load
  balancers", then the index order, ending with practice drawn from the study guide. Each stage quotes the
  Primer's reason for coming next. A short/medium/long timeline selector quotes the study guide and controls
  how much depth is shown; the split of each stage into breadth vs depth is our reading of the guide, and the
  page says so.
  - Every card shows its stage, how many core topics in that stage are read, and the next stop.
  - The home map shows "Start here" or "Continue".
  - The study-guide table is parsed from the source into a timeline checklist.
  - Progress is stored only in the browser, and every storage access is guarded.
- **Auto-generated visuals** (built from each section's own text, `src/visuals/auto.ts`). All 21 "Disadvantage(s)"
  sections become drawback lists, and all 30 "Source(s)" sections become reading lists typed by resource kind.
  Bullet lists become key points or checklists, and source tables become searchable explorers with filters.
- **New hand-built visuals:**
  - DNS lookup and record types
  - CDN push/pull, with a comparison and "choose when"
  - Reverse proxy benefits
  - Load balancer vs reverse proxy
  - Web/platform layers
  - Microservices
  - Service discovery
  - ACID and BASE
  - NoSQL data models (the wide-column and graph examples reuse the data in the Primer's own images)
  - SQL-or-NoSQL picker (tick the Primer's reasons)
  - Denormalization
  - Cache layers
  - Query-level vs object-level caching
  - The async flow (from the Primer's diagram)
  - Message and task queues
  - Back-pressure simulation
  - OSI layers (from the Primer's image)
  - HTTP verb explorer (parsed from the Primer's table)
  - TCP vs UDP (lost and out-of-order packets)
  - RPC (following the Primer's diagram)
  - REST
  - RPC vs REST calls (the Primer's table, one operation at a time)
  - Latency chart (15 rows parsed from the source, log scale, "1 ns = 1 s")
  - Powers-of-two converter
  - Back-of-the-envelope calculator (the solutions' own conversion guide)
  - Performance vs scalability
  - Latency vs throughput
  - The 4 interview steps
  - A problem gallery, and a problem card for each of the 8 problems
  - An OOD gallery
- **Accuracy:**
  - **998 quoted claims** in the metadata are verified verbatim at their cited lines.
  - **74 paraphrases** are marked ≈ in the UI.
  - **1,219 auto-derived claims and links** are re-checked against the source.
  - The latency, powers-of-two and study-guide parsers are pinned by tests.
  - Illustrative values (curves, rates, sample data, IPs) are labelled as such on screen.
- **Smoothness:**
  - Autoplay waits 3 s per step (3.2 s for the TCP handshake), so multi-hop packet sequences finish before the
    next step starts.
  - Badges and captions fade in instead of popping, and step captions cross-fade.
  - Bars and lists animate in.
  - Reduced-motion users get static visuals.
- **Fixed during review:**
  - **Phase 1 bug:** Pastebin's README entry was matched to "Step 3: Design core components", which also links to
    that solution. Matching is now restricted to the questions section, with a test.
  - If the code-highlighting chunk fails to load, code now falls back to plain text instead of throwing.
  - Several diagram layout overlaps.
- The metadata for Phase 3 is generated from `scripts/visuals-spec/phase3.py` (one spec, 89 files).

### Phase 4: architecture builders and OOD class diagrams

- **The 8 system design solutions are now step-through builders** (`/solutions/:id`, `?f=` selects the step).
  - **Tabs:** the four interview steps, plus the talking points. The AWS solution's Step 4 has one sub-tab per
    stage, Users+ to Users+++++, each matching its own Primer image.
  - **Step 1:** every "Calculate usage" figure (36 in all) is recomputed from the stated assumptions, using the
    Primer's 2.5 million seconds per month, and shown next to the quoted figure. ✓ means exact; ≈ shows how far
    the Primer rounded.
  - **Step 2** draws the high-level boxes. **Step 3** adds the internal services and plays each use case hop by
    hop (86 hops in all). Each hop quotes its README line and highlights it in the original text alongside.
  - **Step 4** pops in the scaling additions. Each addition has the sentence that motivates it and links to the
    Primer topics for its trade-offs, followed by the solution's own list of talking-point links.
  - **The split of the Primer's Step 2 image across Steps 2 and 3 is ours**, and the page says so. Together the
    two steps draw exactly the Primer's basic diagram.
  - **Original text sits alongside:** the selected step's section (a stage also shows its step's introduction),
    with a "Show the whole solution" toggle, and the Primer's image under "Compare with the Primer's diagram".
  - **Deviation from the plan:** Step 1 has no use-case chips. The use cases and constraints are shown verbatim in
    the original column instead.
- **Data:** `content/builders/<id>.ts` holds the nodes, edges, groups and routed wires transcribed from the Primer's
  PNGs, plus flows (line numbers only), math checks and additions. Quotes are cut from the cited line at render
  time, so they are verbatim by construction.
- **`tests/builders.test.ts` checks:**
  - every hop's line names one of its two components;
  - every recomputed figure is within 6% of the Primer's, and the stated text is at the cited line;
  - every component added in Step 4 has a reason;
  - every solution image is reproduced by a frame (20/20);
  - no two boxes overlap in any frame;
  - all references are valid.
- **OOD problems open on a class diagram next to the notebook code** (`?view=notebook|module` for the other tabs).
  - Classes, enums, abstract classes, inheritance, constants, `__init__` attributes and methods are read from the
    code by `src/ood/parsePython.ts`.
  - "Holds" associations are hand-picked from attribute names (`content/class-diagrams/`) and drawn dashed, with a
    legend that says so.
  - Clicking a class highlights its lines in the code; clicking a member highlights its line.
  - `tests/ood.test.ts` pins the parser, checks each association's attribute exists, and checks the layout for
    overlaps.
- **Coverage:** the test now renders every step of every solution and every OOD tab. Doing so found that the AWS
  Step 3 subsections and the "Additional talking points" headings weren't reachable in an early version of the
  builder; this is fixed. Coverage is again 172/172 headings, 203/203 solution headings, 583/583 URL checks,
  57/57 images and 14/14 pages.
- **Accuracy flags found while transcribing** (each also shown under "Notes on the source" on its page):
  - **F14: social graph.** The final diagram relabels the "Search API" as "Query API"; the text only ever says
    Search API (L105). The builder shows the rename at Step 4.
  - **F15: sales rank.** The final diagram connects the Sales Rank Service to the SQL Read Replicas, although the
    service writes the `sales_rank` table (L98). Separately, the listed transaction fields add up to 42 bytes,
    which the Primer rounds to ~40.
  - **F16: Twitter naming.** Step 3 says "Search Index Service" (L117) and "Search Cluster" (L210); the diagrams draw
    one "Search Service". The basic diagram's "MySQL" is "SQL database" in the text.
  - **F17: Mint.** The text has the Budget Service call the Notification Service (L145); the diagrams draw that arrow
    from the Transaction Extraction Service. The builder animates the text's version as a dotted, undrawn hop.
  - **F18: analytics stores.** Pastebin's diagram says "SQL Analytics" where the text says "Analytics Database". Mint
    (L372) and Sales Rank (L267) mention an Analytics Database that their diagrams don't draw.
  - **F19: web crawler.** "Crawling Service" (L283) vs "Crawler Service" elsewhere.
  - **F20: OOD code, shown unchanged:**
    - Call center: Supervisor and Director call `super(Operator, self)`, and no subclass passes `call_center`.
    - Deck of cards: the notebook's `deal_card()` lacks `self` and `remaining_cards` uses a bare `deal_index`; the
      .py module fixes both.
    - LRU cache: the notebook's `def get(self, query)` lacks its colon; the module fixes it.
    - Online chat: `PrivateChat` calls `Chat.__init__` without `chat_id`.
- **Housekeeping:** navigating to a new page now scrolls to the top; query-string changes, such as switching
  steps, keep your position.

### Reading revision (after Phase 4 review)

Feedback: the first screen was crowded; topic text was hidden behind a collapsed panel; the lecture page looked empty;
the performance vs scalability chart was unclear; "Source(s)" pages felt incomplete; and the two different "Next"
buttons led readers off their path with no way back.

- **Topics are now reading pages** (`/topic/:id`), with no map beside them.
  - The visual (animation or diagram) is on the left, sticky; the Primer's text is on the right, always open.
  - A layout switch offers **Visual + text** (the default), **Map + text** (a map of this part of the Primer, with
    the current topic marked) or **Text only**. The choice is remembered.
- **Short attached sections are part of their topic's page.** "Source(s) and further reading" and "Disadvantage(s)"
  sit under the topic's text; the disadvantages visual sits under the topic's visual. Their old links still work:
  they open the topic, scrolled to that section and highlighted.
- **Less on screen.**
  - Subtopics and related topics are folded into one "Go deeper" panel, with anything the page already links to
    left out.
  - The visual's lead quote is hidden, since the same sentence is now visible in the text.
- **One next step.**
  - Every page ends with a single prominent button: the next stop on the learning path.
  - The Primer's own previous/next order is a quiet text line underneath.
- **Your place on the path is remembered.**
  - Following the path moves your place forward.
  - Opening another topic (a related link, the map, or search) is a *detour*: the page says so and offers
    **Back to your path**, plus "continue the path from here" if you'd rather switch.
  - The home map's "Pick up where you left off" and the path page's button return to your place.
  - Tested in `tests/journey.test.ts`.
- **The map is for finding your way** (`/` and `/map/:id`). Clicking a topic focuses it and shows a short preview
  with **Read this topic**.
- **Visual fixes:**
  - The lecture and article pages open on the resource itself (a large link to the video or article), then "what it
    covers", each item pointing to where the Atlas covers it. That mapping is ours, and labelled as such.
  - Nested bullet lists stay under their parent instead of being scattered across a grid.
  - Performance vs scalability is now three steps (one user, heavy load, adding resources), with every line labelled
    directly. Each step highlights its sentence in the text alongside.
- **Coverage:** the test now renders every topic page and every map view. It is unchanged at 100%.

### Scope: sections left out (at the reader's request)

The Atlas now leaves out the Primer sections that are about the repository rather than system design:
- Motivation (and its 3 subsections)
- Anki flashcards (and "Coding Resource: Interactive Coding Challenges")
- Contributing
- Index of system design topics (the map replaces it)
- Under development
- Credits
- Contact info
- License

That is 12 headings in all.
- **How:** the list is in `content/scope.json`. The source and the pipeline output stay complete and byte-for-byte;
  only the app hides these sections.
- **Links:** links into them from kept text now go to the section on GitHub.
- **Footer:** it says these sections are left out, as CC BY 4.0 requires changes to be indicated. The license link and
  attribution stay on every page.
- **Coverage:** the test reports these 12 headings as "left out on purpose" and fails if anything else goes missing.
  The rest is 160/160 headings, 510/510 URL checks and 55/55 images.
- **To bring a section back,** remove its id from `content/scope.json` and re-run `python3 scripts/visuals-spec/phase3.py`.

### Presentation revision (reader feedback)

- **The text reads as the Atlas's own.**
  - The pages no longer show "From The System Design Primer" headers, README line references, "≈" paraphrase marks,
    "Original text" labels or "the Primer says" captions.
  - Credit stays in the footer on every page, as CC BY 4.0 requires, and image credits stay under each image.
  - The claim and line data still exist and are still checked by the tests; they just aren't shown.
- **One reading column.** Each topic reads top to bottom:
  - its introduction;
  - the visual, at full width;
  - the rest of the text;
  - further reading and disadvantages.

  This ends the lopsided two-column layout. Images in the text are capped at 380 px high.
- **Videos play in the page.** All 11 YouTube links get a click-to-play player, and nothing loads from YouTube until
  the reader presses play. The link stays above the player.
- **Linked concepts are explained in place.** Clicking one of 38 linked terms (TCP, B-tree, LRU, Little's law,
  MD5…) opens a short explanation of one or two paragraphs, with "Read more" for the full article.
  - The explanations are written in our own words (`content/glossary.ts`). Wikipedia's text is CC BY-SA, which
    would add share-alike terms.
  - Longer external links (articles, papers, talks) stay as links.
  - `tests/glossary.test.ts` checks that every entry matches a link in the text and stays short.
- **Performance vs scalability is text only.** The animation was removed as unhelpful; its two sentences say it
  plainly.
- **Problem images are consistent and generated:**
  - each system design problem shows its own final architecture diagram;
  - each OOD problem shows its class diagram;
  - all drawn in the app's style.

  The scanned diagrams remain inside each solution's walkthrough and under "Reference diagram".

### Source images only where needed

- **53 of the 55 source images are now hidden** wherever the Atlas draws the same idea itself:
  - 31 topic images, each covered by a hand-built visual (CAP, DNS, CDN, load balancer, reverse proxy, application
    layer, replication, federation, sharding, data models, caching strategies, async, OSI, TCP/UDP, RPC, latency
    chart and others);
  - the problem images, replaced by the generated architecture diagrams;
  - all 20 solution diagrams, which the step-through builders redraw.
- **Each image goes together with its "Source:" credit line.** The list is `content/scope.json` → `hiddenImages`;
  the files and credits stay in `content/images.json`.
- **Kept:** the database overview and the real-world architectures diagram, which no Atlas visual replaces.
- **The solution page's "Reference diagram" panel is removed.**
- **Coverage:** the test counts hidden images separately, fails if one still renders anywhere, and still checks the
  2 remaining images and their credits.

### Side panels and the end of the page (mockups A + C + option 2, ribbon)

The layout was chosen from mockups on the design canvas.
- **Wide screens (≥1280 px) use three columns:**
  - **Left:** the current stage's topics, ticked as you read them, with the current one highlighted (`PathNavigator`).
  - **Centre:** the reading column.
  - **Right:** margin notes placed beside the paragraph that holds each link: a short explanation for each linked
    concept (from `content/glossary.ts`) and a one-line summary for each link to another topic. They are measured
    after layout, kept from overlapping, and fade out behind the Next card.
- **Previous / Next cards:**
  - Each is exactly the width of its side column and 104 px high.
  - They stay fixed 16 px above the bottom of the screen while you scroll.
  - At the end of the page they settle into the same row as the stage ribbon, which is the same height, so the three
    line up (checked by measurement).
- **The stage ribbon ends every page:**
  - the stage's stops (done, this one, next, still to come), each a link;
  - "End of <topic>" and how many stops are left.
- **Narrow screens:** one column. The ribbon ends the page, followed by the big Next button and the reading-order line.
- **Maintainer notes:** accuracy notes on visuals (`visual.notes`) are no longer shown to readers; they stay in the
  data and in this document.

### Phase 5: search, faster loading, deploy (flashcards dropped at the reader's request)

- **Search.** Open it with Ctrl/Cmd+K, "/" or the header button.
  - It covers all 160 topics, the 8 problems, the 6 OOD problems and the 38 explained terms. A term opens the topic
    that links it.
  - Every query word must start a word in the title or text; title matches rank first.
  - Matches are highlighted, and body matches show a snippet.
  - Arrow keys move through results, Enter opens one, Esc closes.
  - The index and palette load on first use.
  - `tests/search.test.ts` checks that every topic is found in the top 3 by its own title and that common queries
    rank the obvious answer first.
- **Faster loading.**
  - Pages are lazy chunks.
  - The full solution and notebook files moved to `src/lib/problems.ts`, which only the problem pages, the problem
    card and search load. Everything else uses a small generated `content/problems-index.json`.
  - First visit: ~200 kB gzipped instead of ~445 kB (614 kB uncompressed JS instead of 1.7 MB).
  - Tests render pages synchronously through `AppRoutes({ pages })`.
- **Deploy.** `.github/workflows/deploy.yml` runs on every push to `master` and on demand:
  - checkout with the Primer submodule, `npm ci`, `npm test` (including coverage), `npm run build`;
  - then it publishes `dist/` to GitHub Pages.
  - These steps were verified in a fresh clone.
  - **One-time setup:** Settings → Pages → Source: GitHub Actions.
- Progress tracking and the learning path were already in place.

### Formatting pass

- **One button system** (`.btn` plus `-primary` / `-secondary` / `-ghost`, and `-sm` / `-lg` sizes, in `index.css`),
  used by the animation controls, simulators, map cards, the path page and the solution builder. Disabled buttons
  are dimmed and show a not-allowed cursor; every button has a focus ring.
- **Readable text on indigo.** A new `--on-accent` token puts white on the deep light-mode indigo and near-black on
  the pale dark-mode one; the old white-on-pale-indigo failed contrast.
- **Phones:**
  - the header reads "Map · Path · Problems" on one line;
  - mode toggles keep one even row;
  - the map's welcome card is a compact bar along the bottom, and the zoom buttons are hidden (pinch and drag
    work);
  - the footer is a one-line credit that still notes the changes.
- **Small fixes:** the CAP visual's outcome panel prompts "Press Play…" instead of sitting empty, and the learning
  path card's quote no longer starts with a stray "A:".

### Sleeker end row and a quiet side panel (reader feedback)

- **End row at ~60% height.** Previous, Next and the stage ribbon are now 64 px tall (were 104 px). Card titles sit on
  one truncated line; the ribbon keeps two rows: "✓ End of X" with "Stage N · K to go · next: Y", then the stop dots.
  The three still line up exactly (measured 739–803 at 1440×900 on three pages). The phone Next button is slimmer to
  match, and the ribbon drops its "next:" note on phones since the button right below says it.
- **Right panel.** The notes beside paragraphs left the column mostly empty, so they are replaced by a sticky,
  muted panel (`SidePanel` in `src/topic/rails.tsx`): **Terms** (the page's glossary terms; click one to read its
  short explanation in place), **Go deeper** (subtopics, related topics and topics the text links to) and **Further
  reading** (title plus domain). Small grey text, no colour blocks, so it doesn't pull attention from the reading.
- **No duplicates on wide screens.** There, the "Go deeper" box and further-reading sections that are only a list of
  links move out of the main column into the panel. Sections with any other text stay in the main column, and a
  further-reading section opened from search stays visible. Narrow screens are unchanged, and the server render still
  carries every section, so the coverage tests are unaffected.
- Screenshots: `docs/screenshots/sleek-*.png`.

### Left panel restyle and dimmed side panels (reader feedback)

- The left panel follows the mockup the reader picked: stage label and title, then the stage's topics with a green ✓
  once read (in grey text), a highlighted pill for this page, and ○ for topics still to read. The progress bar and
  "N of M read" line are gone.
- Both side panels sit at 60% opacity so the text in the middle has the focus. Hovering over a panel or tabbing into
  it brings it back to full strength. The Previous/Next cards at the bottom stay at full strength.
- Screenshots: `docs/screenshots/dim-*.png`.
