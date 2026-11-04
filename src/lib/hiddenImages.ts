import scope from '../../content/scope.json'

/** Images the Atlas doesn't show because its own visual covers them (content/scope.json). */
export const HIDDEN_IMAGES: ReadonlySet<string> = new Set(scope.hiddenImages)

/**
 * Where hidden images sit in a markdown text, as [start, end) character ranges. An HTML image block
 * (`<p align="center"><img …>…<i>Source: …</i></p>`) goes as a whole, credit included; a markdown image line goes
 * with its line.
 */
export function hiddenImageRanges(md: string): [number, number][] {
  const out: [number, number][] = []
  for (const m of md.matchAll(/<p align="center">[\s\S]*?<\/p>/g)) {
    const src = /<img src="([^"]+)"/.exec(m[0])?.[1]
    if (src && HIDDEN_IMAGES.has(src)) out.push([m.index!, m.index! + m[0].length])
  }
  for (const m of md.matchAll(/^[ \t]*!\[[^\]]*\]\(([^)\s]+)\)[ \t]*$/gm)) if (HIDDEN_IMAGES.has(m[1])) out.push([m.index!, m.index! + m[0].length])
  return out.sort((a, b) => a[0] - b[0])
}

/** The text without its hidden images. */
export function stripHiddenImages(md: string): string {
  const ranges = hiddenImageRanges(md)
  if (!ranges.length) return md
  let out = ''
  let at = 0
  for (const [a, b] of ranges) {
    out += md.slice(at, a)
    at = b
  }
  return (out + md.slice(at)).replace(/\n{3,}/g, '\n\n')
}

/** 1-based inclusive line ranges of the hidden images in a whole document (for the coverage test). */
export function hiddenImageLines(text: string): [number, number][] {
  const lineAt = (i: number) => text.slice(0, i).split('\n').length
  return hiddenImageRanges(text).map(([a, b]) => [lineAt(a), lineAt(b)])
}
