import { meta } from '../lib/content.ts'

/** CC BY 4.0 attribution: visible on every page. */
export function Footer({ compact = false }: { compact?: boolean }) {
  const a = 'text-link underline-offset-2 hover:underline'
  return (
    <footer className={`shrink-0 border-t border-line bg-surface text-muted ${compact ? 'px-3 py-1.5 text-[11px] leading-snug md:px-4' : 'mt-auto px-4 py-5 text-xs md:px-8'}`}>
      <p>
        An adapted visual edition of{' '}
        <a className={a} href={meta.repo} target="_blank" rel="noopener noreferrer">
          The System Design Primer
        </a>{' '}
        by Donne Martin and contributors, licensed under{' '}
        <a className={a} href={meta.license.url} target="_blank" rel="noopener noreferrer">
          {meta.license.name}
        </a>
        . Changes were made: the text is split into topics and presented with new visuals; the original text is kept
        unchanged in every card{compact ? '.' : ', and each image keeps its original source credit.'}{' '}
        <span className="whitespace-nowrap">
          Source commit{' '}
          <a className={a} href={`${meta.repo}/tree/${meta.commit}`} target="_blank" rel="noopener noreferrer">
            {meta.commit.slice(0, 7)}
          </a>
          .
        </span>
      </p>
    </footer>
  )
}
