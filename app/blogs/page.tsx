import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { BookOpen, Clock, ArrowRight, Tag } from 'lucide-react';
import { getPublishedPosts, TAGS } from '@/lib/server/posts';
import { isVisibleFor, localize } from '@/lib/blog-lang';
import { langNative } from '@/lib/langs';
import { pageLang } from '@/lib/server/lang-pref';
import BlogLangSwitcher from '@/components/BlogLangSwitcher';
import { pageMetadata } from '@/lib/server/seo';
import { getSettings } from '@/lib/server/settings';
import PlayStoreCta from '@/components/PlayStoreCta';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const m = pageMetadata('/blogs');
  return {
    ...m,
    title: (m.title as string | undefined) || 'Blog — Live Train Station | Railway Travel Tips & Guides',
    description: m.description || 'Read our expert guides on Indian railways — booking tips, PNR explained, scenic routes, and more.',
  };
}

const tagColors: Record<string, string> = {
  Tips: 'bg-blue-50 text-blue-600',
  Guide: 'bg-purple-50 text-purple-600',
  Travel: 'bg-green-50 text-green-600',
  Reference: 'bg-orange-50 text-orange-600',
  News: 'bg-rose-50 text-rose-600',
};

interface Item { id: string; slug: string; tag: string; coverImage: string; title: string; excerpt: string; readMinutes: number; lang: string; shown: string }

function Cover({ post, size }: { post: Item; size: number }) {
  if (post.coverImage) {
    return <Image src={post.coverImage} alt="" fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: 'cover' }} unoptimized />;
  }
  return <BookOpen size={size} className="text-[var(--primary)] opacity-40" />;
}

export default async function BlogsPage({ searchParams }: { searchParams: Promise<{ tag?: string; lang?: string }> }) {
  const { tag, lang: langParam } = await searchParams;
  const lang = await pageLang(langParam);
  const all: Item[] = (await getPublishedPosts())
    .filter((p) => isVisibleFor(p, lang))
    .flatMap((p) => {
      const t = localize(p, lang);
      return t ? [{ id: p.id, slug: p.slug, tag: p.tag, coverImage: p.coverImage, title: t.title, excerpt: t.excerpt, readMinutes: t.readMinutes, lang, shown: t.lang }] : [];
    });
  const q = (extra: Record<string, string> = {}) => {
    const sp = new URLSearchParams({ lang, ...extra });
    return sp.toString();
  };
  const postHref = (p: Item) => `/blogs/${p.slug}?lang=${p.shown}`;
  const posts = tag ? all.filter((p) => p.tag === tag) : all;
  const [featured, ...rest] = posts;
  const tags = Array.from(new Set([...TAGS, ...all.map((p) => p.tag)])).filter((t) => all.some((p) => p.tag === t));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
            <BookOpen size={20} className="text-[var(--primary)]" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold">Live Train Station Blog</h1>
        </div>
        <p className="text-[var(--muted)] mt-2">
          Railway tips, travel guides, booking tricks and more — curated for Indian travellers.
        </p>
      </div>

      <BlogLangSwitcher current={lang} basePath="/blogs" keep={tag ? { tag } : {}} />

      <div className="flex flex-wrap gap-2 mb-8 items-center">
        <div className="flex items-center gap-1 text-sm text-[var(--muted)]">
          <Tag size={14} />
          <span className="font-semibold">Filter:</span>
        </div>
        <Link href={`/blogs?${q()}`} className={`text-xs font-bold px-3 py-1 rounded-full transition ${!tag ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'bg-gray-100 text-gray-600'}`}>
          All
        </Link>
        {tags.map((t) => (
          <Link
            key={t}
            href={`/blogs?${q({ tag: t })}`}
            className={`text-xs font-bold px-3 py-1 rounded-full hover:opacity-80 transition ${tag === t ? 'ring-2 ring-[var(--primary)] ' : ''}${tagColors[t] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {t}
          </Link>
        ))}
      </div>

      {!featured && <p className="text-[var(--muted)] py-16 text-center">No articles yet. Check back soon!</p>}

      {featured && (
        <Link href={postHref(featured)} className="glass-card mb-8 overflow-hidden flex flex-col md:flex-row group block">
          <div className="relative md:w-80 h-52 md:h-auto bg-gradient-to-br from-[#A5E9DD]/40 to-[#34908B]/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Cover post={featured} size={60} />
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tagColors[featured.tag] ?? 'bg-gray-100 text-gray-600'}`}>{featured.tag}</span>
              {featured.shown !== lang && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{langNative(featured.shown)}</span>}
              <span className="text-xs text-[var(--muted)] flex items-center gap-1"><Clock size={12} /> {featured.readMinutes} min read</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug mb-3">{featured.title}</h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">{featured.excerpt}</p>
            <div className="flex items-center gap-2 text-[var(--primary)] font-semibold text-sm">Read article <ArrowRight size={14} /></div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((post) => (
          <Link key={post.id} href={postHref(post)} className="glass-card overflow-hidden group block flex flex-col">
            <div className="relative h-40 bg-gradient-to-br from-[#A5E9DD]/30 to-[#34908B]/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Cover post={post} size={40} />
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tagColors[post.tag] ?? 'bg-gray-100 text-gray-600'}`}>{post.tag}</span>
                {post.shown !== lang && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{langNative(post.shown)}</span>}
                <span className="text-xs text-[var(--muted)] flex items-center gap-1"><Clock size={11} /> {post.readMinutes} min read</span>
              </div>
              <h3 className="font-heading font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug mb-2 flex-1">{post.title}</h3>
              <p className="text-sm text-[var(--muted)] line-clamp-2 mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">Read more <ArrowRight size={12} /></div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16">
        <PlayStoreCta url={getSettings().site.playStoreUrl} />
      </div>
    </div>
  );
}
