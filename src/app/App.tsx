import { NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { MapPage } from '../pages/MapPage.tsx'
import { SolutionPage } from '../pages/SolutionPage.tsx'
import { OodPage } from '../pages/OodPage.tsx'
import { ProblemsPage } from '../pages/ProblemsPage.tsx'
import { PathPage } from '../pages/PathPage.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'
import { Footer } from './Footer.tsx'

function Header() {
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
      <nav aria-label="Main" className="flex items-center gap-1 text-sm">
        <NavLink to="/" end className={({ isActive }) => nav({ isActive: isActive || false })}>
          Map
        </NavLink>
        <NavLink to="/path" className={nav}>
          Learning path
        </NavLink>
        <NavLink to="/problems" className={nav}>
          Problems
        </NavLink>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  )
}

function Layout() {
  const { pathname } = useLocation()
  const fullBleed = pathname === '/' || pathname.startsWith('/topic/')
  return (
    <div className="flex h-full flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <Header />
      <main id="main" className={`flex min-h-0 flex-1 flex-col ${fullBleed ? '' : 'overflow-y-auto'}`}>
        <Outlet />
        {!fullBleed && <Footer />}
      </main>
      {fullBleed && <Footer compact />}
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<MapPage />} />
        <Route path="topic/:id" element={<MapPage />} />
        <Route path="path" element={<PathPage />} />
        <Route path="problems" element={<ProblemsPage />} />
        <Route path="solutions/:id" element={<SolutionPage />} />
        <Route path="ood/:id" element={<OodPage />} />
        <Route path="*" element={<p className="p-6">Page not found.</p>} />
      </Route>
    </Routes>
  )
}
