/** Reduce markdown to comparable plain text: drop emphasis, code ticks, link targets, HTML tags; collapse spaces. */
export function plain(md: string): string {
  return md
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\((?:[^()]|\([^)]*\))*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The cited lines of a document, as plain text. */
export function linesText(doc: string, [from, to]: [number, number]): string {
  return plain(doc.split('\n').slice(from - 1, to).join('\n'))
}
