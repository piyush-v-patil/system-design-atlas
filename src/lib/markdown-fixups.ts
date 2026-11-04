/**
 * Render-time fix-up (the stored source stays byte-exact): the Primer writes some inline links as `<a href=URL>`
 * with an unquoted value. GitHub renders these, but micromark does not recognise them as inline HTML, and GFM then
 * turns the URL into an autolink that swallows `>1`. Quoting the value restores GitHub's rendering.
 */
export function normalizeInlineHtml(markdown: string): string {
  return markdown.replace(/<a href=([^\s"'<>`]+)>/g, '<a href="$1">')
}
