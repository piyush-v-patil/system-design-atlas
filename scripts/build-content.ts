/**
 * Content pipeline: ./source (pristine Primer, read-only) → content/*.json + public/images.
 * Run with `npm run content`. Nothing here edits ./source.
 */
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ContentMeta, SourceRef } from '../src/lib/types.ts'
import { buildTopics } from './readme.ts'
import { buildSolution, readmeSolutionTitles } from './solutions.ts'
import { buildOod, readmeOodTitles } from './ood.ts'
import { buildImageManifest, copyImages, docMarkdown } from './images.ts'
import { buildHighlights } from './highlight.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(ROOT, 'source')
const CONTENT = join(ROOT, 'content')
const PUBLIC = join(ROOT, 'public')
const REPO = 'https://github.com/donnemartin/system-design-primer'

function write(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 1) + '\n')
}

async function main() {
  const commit = execSync('git rev-parse HEAD', { cwd: SOURCE }).toString().trim()
  const base: Omit<SourceRef, 'path'> = { repo: REPO, commit }

  const readme = readFileSync(join(SOURCE, 'README.md'), 'utf8')
  const topics = buildTopics(readme, { ...base, path: 'README.md' })

  const solTitles = readmeSolutionTitles(readme)
  const solDirs = readdirSync(join(SOURCE, 'solutions/system_design')).filter((d) =>
    statSync(join(SOURCE, 'solutions/system_design', d, 'README.md'), { throwIfNoEntry: false })?.isFile(),
  )
  const solutions = solDirs.map((d) => buildSolution(SOURCE, d, base, solTitles, topics))
  // Keep README order.
  const solOrder = [...solTitles.keys()]
  solutions.sort((a, b) => solOrder.indexOf(a.dir) - solOrder.indexOf(b.dir))

  const oodTitles = readmeOodTitles(readme)
  const oods = [...oodTitles.keys()].map((d) => buildOod(SOURCE, d, base, oodTitles))

  const copied = await copyImages(SOURCE, PUBLIC)
  const images = buildImageManifest(
    [
      { path: 'README.md', markdown: readme },
      ...solutions.map((s) => ({ path: s.source.path, markdown: docMarkdown(s) })),
      ...oods.map((o) => ({ path: o.source.path, markdown: o.markdown })),
    ],
    copied,
    PUBLIC,
  )

  const highlights = await buildHighlights(
    [readme, ...solutions.map(docMarkdown), ...oods.map((o) => o.markdown)],
    oods.flatMap((o) => (o.module ? [{ lang: 'python', code: o.module.code }] : [])),
  )

  const meta: ContentMeta = {
    repo: REPO,
    commit,
    license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
    generatedFrom: ['README.md', ...solutions.map((s) => s.source.path), ...oods.map((o) => o.source.path)],
  }

  rmSync(join(CONTENT, 'solutions'), { recursive: true, force: true })
  rmSync(join(CONTENT, 'ood'), { recursive: true, force: true })
  write(join(CONTENT, 'meta.json'), meta)
  write(join(CONTENT, 'topics.json'), topics)
  for (const s of solutions) write(join(CONTENT, 'solutions', `${s.id}.json`), s)
  for (const o of oods) write(join(CONTENT, 'ood', `${o.id}.json`), o)
  write(join(CONTENT, 'images.json'), images)
  write(join(CONTENT, 'highlight.json'), highlights)
  // A small index of the problems, so pages that only link to them don't load the full solution files.
  write(join(CONTENT, 'problems-index.json'), {
    solutions: solutions.map((s) => ({ id: s.id, dir: s.dir, title: s.title, readmeTitle: s.readmeTitle, readmeTopicId: s.readmeTopicId })),
    oods: oods.map((o) => ({
      id: o.id,
      dir: o.dir,
      title: o.title,
      readmeTitle: o.readmeTitle,
      classes: [...(o.cells.find((c) => c.cellType === 'code')?.source ?? '').matchAll(/^class (\w+)/gm)].map((m) => m[1]),
    })),
  })

  console.log(
    `content: ${topics.order.length} topics, ${solutions.length} solutions, ${oods.length} OOD, ` +
      `${Object.keys(images.entries).length} image refs (${images.unreferenced.length} unreferenced files), ` +
      `${Object.keys(highlights).length} highlighted blocks @ ${commit.slice(0, 7)}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
