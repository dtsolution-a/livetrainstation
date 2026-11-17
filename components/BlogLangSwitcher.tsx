'use client';

import Link from 'next/link';
import { Languages } from 'lucide-react';
import { LANGS } from '@/lib/langs';

/**
 * Language chips for the blog. [only] limits them to the languages a post is written in
 * (on a post page); without it all eight are offered (on the list). The choice is remembered
 * in a cookie so the next page opens in the same language.
 */
export default function BlogLangSwitcher({
  current, basePath, only, keep = {},
}: { current: string; basePath: string; only?: string[]; keep?: Record<string, string> }) {
  const langs = LANGS.filter((l) => !only || only.includes(l.code));
  if (langs.length < 2) return null;

  const href = (code: string) => {
    const q = new URLSearchParams({ ...keep, lang: code });
    return `${basePath}?${q.toString()}`;
  };
  const remember = (code: string) => {
    try { document.cookie = `ls_lang=${code}; path=/; max-age=31536000; SameSite=Lax`; } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6" aria-label="Language">
      <span className="flex items-center gap-1 text-sm text-[var(--muted)] font-semibold"><Languages size={14} /> Language:</span>
      {langs.map((l) => (
        <Link
          key={l.code}
          href={href(l.code)}
          onClick={() => remember(l.code)}
          className={`text-xs font-bold px-3 py-1 rounded-full transition ${current === l.code ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'bg-gray-100 text-gray-600 hover:opacity-80'}`}
          hrefLang={l.code}
        >
          {l.native}
        </Link>
      ))}
    </div>
  );
}
