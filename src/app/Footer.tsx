import { meta } from '../lib/content.ts'

/**
 * CC BY 4.0 attribution, kept to one quiet line: the source and its authors, the licence, and that it was adapted.
 * The licence requires all three, so this line should stay on every page.
 */
export function Footer({ compact = false }: { compact?: boolean }) {
  const a = 'underline-offset-2 hover:text-ink hover:underline'
  return (
    <footer className={`shrink-0 px-4 text-center text-label text-muted/80 ${compact ? 'py-1' : 'mt-auto py-3'}`}>
      Adapted from{' '}
      <a className={a} href={`${meta.repo}/tree/${meta.commit}`} target="_blank" rel="noopener noreferrer">
        The System Design Primer
      </a>{' '}
      by Donne Martin and contributors ·{' '}
      <a className={a} href={meta.license.url} target="_blank" rel="noopener noreferrer">
        {meta.license.name}
      </a>
    </footer>
  )
}
