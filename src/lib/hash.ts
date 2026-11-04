/** FNV-1a (32-bit) as hex. Used to key pre-highlighted code blocks identically at build time and in the browser. */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export function codeKey(lang: string | null | undefined, code: string): string {
  return fnv1a(`${lang || 'text'}\u0000${code}`) + code.length.toString(36)
}
