import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import type { ComponentType } from 'react'
import { ThemeToggle } from './ThemeToggle.tsx'
import { Footer } from './Footer.tsx'

// The search palette and its index load on first use.
const SearchPalette = lazy(() => import('../search/SearchPalette.tsx').then((m) => ({ default: m.SearchPalette })))
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** Ctrl/Cmd+K or "/" (outside text fields) opens search; the header button too. */
function useSearchShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
}

function Header({ onSearch }: { onSearch: () => void }) {
  const { pathname } = useLocation()
  const nav = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-2.5 py-1.5 ${isActive ? 'bg-surface-2 font-semibold text-ink' : 'text-muted hover:text-ink'}`
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 md:px-4">
      <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <svg aria-hidden viewBox="0 0 32 32" className="size-6">
          <circle cx="16" cy="16" r="4.5" fill="var(--accent)" />
          <circle cx="16" cy="16" r="12.5" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
        <span className="hidden sm:inline">System Design Atlas</span>
      </NavLink>
      <nav aria-label="Main" className="flex items-center gap-0.5 text-sm whitespace-nowrap sm:gap-1">
        <NavLink to="/" end className={({ isActive }) => nav({ isActive: isActive || pathname === '/path' })}>
          Learn
        </NavLink>
        <NavLink to="/map" className={nav}>
          Map
        </NavLink>
        <NavLink to="/problems" className={nav}>
          Problems
        </NavLink>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-8 items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 text-sm text-muted hover:text-ink sm:w-56"
          aria-label="Search"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.2-4.2" />
          </svg>
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-auto hidden rounded border border-line px-1.5 text-[0.6875rem] sm:inline">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}

function Layout() {
  const { pathname } = useLocation()
  const fullBleed = pathname === '/map' || pathname.startsWith('/map/')
  const mainRef = useRef<HTMLElement>(null)
  const [searching, setSearching] = useState(false)
  const openSearch = useRef(() => setSearching(true)).current
  useSearchShortcut(openSearch)
  // A new page starts at the top (query-string changes, e.g. a solution's step, keep the position).
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])
  return (
    <div className="flex h-full flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <Header onSearch={openSearch} />
      {searching && (
        <Suspense fallback={null}>
          <SearchPalette onClose={() => setSearching(false)} />
        </Suspense>
      )}
      <main ref={mainRef} id="main" className={`flex min-h-0 flex-1 flex-col ${fullBleed ? '' : 'overflow-y-auto'}`}>
        <Outlet />
        {!fullBleed && <Footer />}
      </main>
      {fullBleed && <Footer compact />}
    </div>
  )
}

/** The pages. Each loads as its own chunk the first time it is opened, so the first visit downloads only the home page. */
export interface Pages {
  HomePage: ComponentType
  MapPage: ComponentType
  TopicPage: ComponentType
  SolutionPage: ComponentType
  OodPage: ComponentType
  ProblemsPage: ComponentType
  PathPage: ComponentType
}
const lazyPage = <K extends keyof Pages>(load: () => Promise<Record<K, ComponentType>>, name: K) => lazy(() => load().then((m) => ({ default: m[name] })))
export const LAZY_PAGES: Pages = {
  HomePage: lazyPage(() => import('../pages/HomePage.tsx'), 'HomePage'),
  MapPage: lazyPage(() => import('../pages/MapPage.tsx'), 'MapPage'),
  TopicPage: lazyPage(() => import('../topic/TopicPage.tsx'), 'TopicPage'),
  SolutionPage: lazyPage(() => import('../pages/SolutionPage.tsx'), 'SolutionPage'),
  OodPage: lazyPage(() => import('../pages/OodPage.tsx'), 'OodPage'),
  ProblemsPage: lazyPage(() => import('../pages/ProblemsPage.tsx'), 'ProblemsPage'),
  PathPage: lazyPage(() => import('../pages/PathPage.tsx'), 'PathPage'),
}

function Loading() {
  return <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted" aria-live="polite">Loading…</div>
}

/** `pages` is replaceable so tests can render every page synchronously. */
export function AppRoutes({ pages = LAZY_PAGES }: { pages?: Pages }) {
  const { HomePage, MapPage, TopicPage, SolutionPage, OodPage, ProblemsPage, PathPage } = pages
  const page = (P: ComponentType) => (
    <Suspense fallback={<Loading />}>
      <P />
    </Suspense>
  )
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={page(HomePage)} />
        <Route path="map" element={page(MapPage)} />
        <Route path="map/:id" element={page(MapPage)} />
        <Route path="topic/:id" element={page(TopicPage)} />
        <Route path="path" element={page(PathPage)} />
        <Route path="problems" element={page(ProblemsPage)} />
        <Route path="solutions/:id" element={page(SolutionPage)} />
        <Route path="ood/:id" element={page(OodPage)} />
        <Route path="*" element={<p className="p-6">Page not found.</p>} />
      </Route>
    </Routes>
  )
}
