/**
 * Small, safe Markdown → HTML renderer for blog posts.
 * All source text is HTML-escaped FIRST, so raw HTML/script in a post can never execute;
 * only the constructs below produce tags. Links and images are limited to safe URLs.
 */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const safeHref = (u: string) => {
  const url = u.replace(/&amp;/g, '&').trim();
  if (/^(https?:\/\/|\/(?!\/)|#|mailto:)/i.test(url)) return esc(url);
  return '#';
};
const safeImg = (u: string) => {
  const url = u.replace(/&amp;/g, '&').trim();
  return /^(https:\/\/|\/uploads\/)/i.test(url) ? esc(url) : '';
};

function inline(raw: string): string {
  let s = esc(raw);
  // images first (so the link rule doesn't eat them)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, src: string) => {
    const u = safeImg(src);
    return u ? `<img src="${u}" alt="${alt}" loading="lazy" class="rounded-2xl my-4 w-full h-auto" />` : '';
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
    const external = /^https?:\/\//i.test(href.replace(/&amp;/g, '&'));
    return `<a href="${safeHref(href)}" class="text-[var(--primary)] underline hover:opacity-80"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
  });
  s = s.replace(/`([^`]+)`/g, '<code class="bg-[var(--border)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--primary)]">$1</code>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  return s;
}

const cells = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

export function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    let m: RegExpExecArray | null;
    if ((m = /^(#{2,4})\s+(.+?)\s*#*\s*$/.exec(line))) {
      const level = m[1].length;
      const cls =
        level === 2 ? 'font-heading font-extrabold text-2xl mt-10 mb-4 text-[var(--text)]'
        : level === 3 ? 'font-heading font-bold text-xl mt-8 mb-3 text-[var(--text)]'
        : 'font-heading font-bold text-lg mt-6 mb-2 text-[var(--text)]';
      out.push(`<h${level} class="${cls}">${inline(m[2])}</h${level}>`);
      i++; continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr class="my-8 border-[var(--border)]" />'); i++; continue; }

    // table: header row + separator row
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
      out.push(
        `<div class="overflow-x-auto my-6"><table class="w-full glass-card"><thead><tr class="bg-[var(--border)]/50">` +
        head.map((c) => `<th class="text-left py-2 px-3 font-bold text-xs uppercase tracking-wider text-[var(--muted)]">${inline(c)}</th>`).join('') +
        `</tr></thead><tbody>` +
        rows.map((r) => `<tr>${r.map((c) => `<td class="py-2 px-3 text-sm border-t border-[var(--border)]">${inline(c)}</td>`).join('')}</tr>`).join('') +
        `</tbody></table></div>`,
      );
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push(`<blockquote class="border-l-4 border-[var(--primary)] pl-4 my-5 text-[var(--muted)] italic">${inline(buf.join(' '))}</blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      out.push(`<ul class="my-4 space-y-2">${items.map((t) => `<li class="flex items-start gap-2 text-[15px] text-[var(--text)]"><span class="text-[var(--primary)] mt-0.5">•</span><span>${inline(t)}</span></li>`).join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      out.push(`<ol class="my-4 space-y-2 list-decimal pl-6 marker:text-[var(--primary)] marker:font-bold">${items.map((t) => `<li class="text-[15px] text-[var(--text)] pl-1">${inline(t)}</li>`).join('')}</ol>`);
      continue;
    }

    // paragraph: gather until blank line / block start
    const buf: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^(#{2,4})\s+/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^\s*>/.test(lines[i]) && !/^(-{3,}|\*{3,})\s*$/.test(lines[i])
    ) buf.push(lines[i++]);
    out.push(`<p class="text-[var(--text)] leading-relaxed mb-4 text-[15px]">${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}
