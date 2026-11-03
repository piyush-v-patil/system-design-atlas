# System Design Atlas

An interactive, visual learning atlas built on top of
[The System Design Primer](https://github.com/donnemartin/system-design-primer) by Donne Martin and contributors.

Every topic has three layers:

1. **Map**: a node in a zoomable radial mind map of every heading in the Primer.
2. **Visual card**: diagrams, animations, trade-off comparisons and calculators (added from Phase 2 on).
3. **Original**: the full original section text, rendered from the Primer's markdown, with its images, code,
   tables and links. Visuals sit on top of the original text and never replace it.

## How nothing gets lost

- `./source` is the Primer as a git submodule pinned to a fixed commit. It is never modified.
- `npm run content` parses it into `content/*.json`. Every section's markdown is a byte-exact slice of the
  source. `tests/pipeline.test.ts` re-assembles `README.md` and every solution README from the JSON and checks
  that they are byte-identical to the originals.
- `tests/coverage.test.ts` re-parses the sources independently and server-renders every route. It checks that
  every heading is reachable from the map, every URL and image appears in the app (images with their credits),
  and every solution and OOD problem has a page. It prints a list of anything missing.
- Hand-written visual metadata lives in `content/visuals/<topic-id>.ts` and is kept separate from the source
  text.

See [`docs/PLAN.md`](docs/PLAN.md) for the full plan, the topic tree, and the accuracy flags raised while
reading the source.

## Develop

```bash
git submodule update --init
```

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

`npm run build` outputs a static site in `dist/`. It uses hash routing and relative asset paths, so it can be
served from any path (GitHub Pages or Vercel).

## Attribution and license

The content (text, images and diagrams) comes from
[The System Design Primer](https://github.com/donnemartin/system-design-primer), © 2017 Donne Martin, licensed
under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
This is an **adapted visual edition**. The text is split into topics and presented with new visuals, and the
original text is kept unchanged alongside them. Images keep their original per-image source credits. The
"Latency numbers visualized" image is served by the Primer from `i.imgur.com/k0t1e.png` and is vendored in
`public/images/remote/`.

The adapted content in this repository is shared under the same CC BY 4.0 license.
