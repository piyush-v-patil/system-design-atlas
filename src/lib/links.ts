import { githubBlob, oodRefByDir, solutionRefByDir, topics } from './content.ts'

export type ResolvedLink =
  | { kind: 'route'; to: string; source: string }
  | { kind: 'external'; href: string; source: string }

const PRIMER_URL = /^https?:\/\/github\.com\/donnemartin\/system-design-primer\/?(?:#(.*))?$/i

function normalize(path: string): string {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (part === '..') out.pop()
    else if (part !== '.' && part !== '') out.push(part)
  }
  return out.join('/')
}

function topicRoute(anchor: string): string | null {
  const id = decodeURIComponent(anchor)
  return topics.nodes[id] ? `/topic/${id}` : null
}

/**
 * Map a link from the Primer to where it lives in the Atlas. In-Primer links become app routes; the original
 * target is always kept in `source` (rendered as data-source-href) so nothing is lost.
 */
export function resolveLink(href: string, docPath: string): ResolvedLink {
  const source = href
  if (href.startsWith('#')) {
    const to = topicRoute(href.slice(1))
    if (to) return { kind: 'route', to, source }
    return { kind: 'external', href: githubBlob(docPath) + href, source }
  }
  const primer = PRIMER_URL.exec(href)
  if (primer) {
    const to = primer[1] ? topicRoute(primer[1]) : `/topic/${topics.rootId}`
    if (to) return { kind: 'route', to, source }
    return { kind: 'external', href, source }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return { kind: 'external', href, source }

  // Relative path inside the Primer repo.
  const [pathPart, hash] = href.split('#')
  const dir = docPath.includes('/') ? docPath.slice(0, docPath.lastIndexOf('/')) : ''
  const path = normalize(dir ? `${dir}/${pathPart}` : pathPart)
  const sol = /^solutions\/system_design\/([^/]+)\/README\.md$/.exec(path)
  if (sol && solutionRefByDir.has(sol[1])) return { kind: 'route', to: `/solutions/${solutionRefByDir.get(sol[1])!.id}`, source }
  const ood = /^solutions\/object_oriented_design\/([^/]+)\/[^/]+\.ipynb$/.exec(path)
  if (ood && oodRefByDir.has(ood[1])) return { kind: 'route', to: `/ood/${oodRefByDir.get(ood[1])!.id}`, source }
  if (path === 'README.md' && !hash) return { kind: 'route', to: `/topic/${topics.rootId}`, source }
  return { kind: 'external', href: githubBlob(path) + (hash ? `#${hash}` : ''), source }
}
