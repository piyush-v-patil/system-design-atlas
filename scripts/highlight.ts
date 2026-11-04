import { createHighlighter } from 'shiki'
import { visit } from 'unist-util-visit'
import type { Code } from 'mdast'
import { codeKey } from '../src/lib/hash.ts'
import { parseMarkdown } from './util/markdown.ts'

/**
 * Pre-highlight every fenced block that declares a language (only `python` occurs in the Primer).
 * Unlabelled blocks stay plain: their language isn't stated in the source.
 * Output: { [codeKey(lang, code)]: html } with light/dark colours as CSS variables.
 */
export async function buildHighlights(markdowns: string[], extra: { lang: string; code: string }[]) {
  const blocks: { lang: string; code: string }[] = [...extra]
  for (const md of markdowns)
    visit(parseMarkdown(md), 'code', (node: Code) => {
      if (node.lang) blocks.push({ lang: node.lang, code: node.value })
    })
  const langs = [...new Set(blocks.map((b) => b.lang))]
  const highlighter = await createHighlighter({ themes: ['github-light', 'github-dark'], langs })
  const out: Record<string, string> = {}
  for (const b of blocks) {
    const key = codeKey(b.lang, b.code)
    if (out[key]) continue
    out[key] = highlighter.codeToHtml(b.code, {
      lang: b.lang,
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: 'light',
    })
  }
  highlighter.dispose()
  return out
}
