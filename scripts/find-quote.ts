/** Authoring helper: `npx tsx scripts/find-quote.ts "some text" [doc]` prints the README line(s) containing it. */
import { readFileSync } from 'node:fs'
import { plain } from '../src/lib/quote.ts'
const [needle, doc = 'README.md'] = process.argv.slice(2)
const lines = readFileSync(new URL(`../source/${doc}`, import.meta.url), 'utf8').split('\n')
const n = plain(needle)
lines.forEach((l, i) => plain(l).includes(n) && console.log(`${i + 1}: ${l.slice(0, 140)}`))
