import { useSyncExternalStore } from 'react'
import type { Timeline } from '../../content/visuals/_shared/path.ts'

/**
 * Per-viewer reading progress, kept in this browser only. Every storage access is guarded: in private windows or
 * with storage blocked the app still works, progress just isn't remembered.
 */
const READ_KEY = 'atlas-read'
const TIMELINE_KEY = 'atlas-timeline'
const CURSOR_KEY = 'atlas-path-cursor'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

let read: Set<string> = new Set(typeof window === 'undefined' ? [] : load<string[]>(READ_KEY, []))
let cursor: string | null = typeof window === 'undefined' ? null : load<string | null>(CURSOR_KEY, null)
let timeline: Timeline = typeof window === 'undefined' ? 'medium' : load<Timeline>(TIMELINE_KEY, 'medium')
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l))

let readSnapshot = read
export function markRead(id: string) {
  if (read.has(id)) return
  read = new Set(read).add(id)
  readSnapshot = read
  save(READ_KEY, [...read])
  emit()
}
export function resetProgress() {
  read = new Set()
  readSnapshot = read
  save(READ_KEY, [])
  cursor = null
  save(CURSOR_KEY, null)
  emit()
}

/** The last learning-path stop the reader reached in order: where "Back to your path" returns to. */
export function setPathCursor(id: string | null) {
  if (cursor === id) return
  cursor = id
  save(CURSOR_KEY, id)
  emit()
}
export const getPathCursor = () => cursor
export function usePathCursor(): string | null {
  return useSyncExternalStore(subscribe, () => cursor, () => null)
}
export function useRead(): Set<string> {
  return useSyncExternalStore(subscribe, () => readSnapshot, () => readSnapshot)
}

export function setTimeline(t: Timeline) {
  timeline = t
  save(TIMELINE_KEY, t)
  emit()
}
export function useTimeline(): Timeline {
  return useSyncExternalStore(subscribe, () => timeline, () => 'medium' as Timeline)
}
