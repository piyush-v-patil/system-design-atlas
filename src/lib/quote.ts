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

/**
 * One source line, readable and verbatim: list marker, link targets, bold/italic markers and code ticks removed,
 * everything else (including underscores in identifiers) kept.
 */
export function lineQuote(doc: string, line: number): string {
  const raw = doc.split('\n')[line - 1] ?? ''
  return raw
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/, '')
    .replace(/!?\[([^\]]*)\]\((?:[^()]|\([^)]*\))*\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, '$1$2')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
