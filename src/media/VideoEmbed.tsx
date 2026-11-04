import { useState } from 'react'

/** The YouTube video id in a youtube.com/watch?v=…, youtu.be/… or youtube.com/embed/… link. */
export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\.|^m\./, '')
    if (host === 'youtu.be') return u.pathname.slice(1) || null
    if (host === 'youtube.com') return u.searchParams.get('v') ?? (/^\/embed\/([\w-]+)/.exec(u.pathname)?.[1] || null)
  } catch {
    /* not a URL */
  }
  return null
}

/**
 * A video in the page. Shows the thumbnail with a play button and only loads the player when pressed, so pages with
 * several videos stay fast and nothing is sent to YouTube until the reader asks for it.
 */
export function VideoEmbed({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  return (
    <span className="not-prose my-3 block w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-black">
      <span className="relative block aspect-video">
        {playing ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full" aria-label={`Play video: ${title}`}>
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="video-thumb size-full object-cover opacity-85 transition-opacity group-hover:opacity-100" />
            <span aria-hidden className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-black/70 text-2xl text-white shadow-lg transition-transform group-hover:scale-110">▶</span>
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-2 text-left text-sm font-medium text-white">{title}</span>
          </button>
        )}
      </span>
    </span>
  )
}
