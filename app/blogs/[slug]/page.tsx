import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Clock, ArrowLeft, ArrowRight, BookOpen, User, Calendar } from 'lucide-react';
import { getPublishedPosts, publicDate } from '@/lib/server/posts';
import { postMetadata, articleJsonLd, jsonLdString } from '@/lib/server/seo';
import { getSettings } from '@/lib/server/settings';
import { isVisibleFor, localize } from '@/lib/blog-lang';
import { pageLang } from '@/lib/server/lang-pref';
import BlogLangSwitcher from '@/components/BlogLangSwitcher';
import { renderMarkdown } from '@/lib/markdown';
import PlayStoreCta from '@/components/PlayStoreCta';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lang = await pageLang((await searchParams).lang);
  const post = (await getPublishedPosts()).find((p) => p.slug === slug);
  const t = post && localize(post, lang);
  if (!post || !t) return { title: 'Post Not Found', robots: { index: false } };
  return postMetadata(post, t.lang);
}

const tagColors: Record<string, string> = {
  Tips: 'bg-blue-50 text-blue-600',
  Guide: 'bg-purple-50 text-purple-600',
  Travel: 'bg-green-50 text-green-600',
  Reference: 'bg-orange-50 text-orange-600',
  News: 'bg-rose-50 text-rose-600',
};

export default async function BlogPostPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const lang = await pageLang((await searchParams).lang);
  const all = await getPublishedPosts();
  const post0 = all.find((p) => p.slug === slug);
  const t = post0 && localize(post0, lang);
  if (!post0 || !t) notFound();
  const post = { ...post0, title: t.title, excerpt: t.excerpt, content: t.content };
  const shown = t.lang;
  const posts = all.filter((p) => isVisibleFor(p, lang));
  const idx = posts.findIndex((p) => p.slug === slug);
  const nav = (p: typeof posts[number] | null) => {
    const nt = p && localize(p, lang);
    return p && nt ? { slug: p.slug, title: nt.title, lang: nt.lang } : null;
  };
  const prev = nav(idx > 0 ? posts[idx - 1] : null);
  const next = nav(idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null);
  const html = renderMarkdown(post.content);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(articleJsonLd(post0, shown)) }} />

      <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-8">
        <Link href="/blogs" className="hover:text-[var(--primary)] flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> Blog
        </Link>
        <span>/</span>
        <span className="text-[var(--text)] truncate">{post.title}</span>
      </div>

      {/* Title first: tag + read time, the headline, then who/when — before any picture. */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tagColors[post.tag] ?? 'bg-gray-100 text-gray-600'}`}>{post.tag}</span>
        <span className="flex items-center gap-1 text-sm text-[var(--muted)]"><Clock size={14} /> {t.readMinutes} min read</span>
      </div>

      <h1 className="font-heading text-[28px] md:text-4xl font-extrabold text-[var(--text)] leading-[1.2] tracking-tight mb-4">{post.title}</h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)] mb-5">
        <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
        <span className="flex items-center gap-1.5">
          <Calendar size={14} /> {new Date(publicDate(post)).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <BlogLangSwitcher current={shown} basePath={`/blogs/${post0.slug}`} only={t.languages} />

      {/* No empty picture box on phones when a post has no cover. */}
      <div className={`relative h-48 sm:h-56 rounded-3xl bg-gradient-to-br from-[#A5E9DD]/40 to-[#34908B]/20 items-center justify-center mb-6 overflow-hidden ${post.coverImage ? 'flex' : 'hidden sm:flex'}`}>
        {post.coverImage ? (
          <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 768px) 100vw, 768px" style={{ objectFit: 'cover' }} priority unoptimized />
        ) : (
          <BookOpen size={64} className="text-[var(--primary)] opacity-30" />
        )}
      </div>

      {post.excerpt && (
        <p className="text-[18px] text-[var(--muted)] leading-[1.6] font-medium mb-8 border-l-4 border-[var(--primary)] pl-4">{post.excerpt}</p>
      )}

      <article className="max-w-none" dangerouslySetInnerHTML={{ __html: html }} />

      <div className="mt-12 p-6 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
        <h3 className="font-heading font-bold text-lg mb-2">Try Live Train Station Now</h3>
        <p className="text-sm text-[var(--muted)] mb-4">Track your train in real-time, check PNR status, and more — free, no sign-up required.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/live" className="premium-btn text-sm px-4 py-2 flex items-center gap-1">Live Train Status <ArrowRight size={14} /></Link>
          <Link href="/pnr" className="text-sm px-4 py-2 rounded-xl border border-[var(--primary)] text-[var(--primary)] font-bold hover:bg-[var(--primary)] hover:text-[var(--on-primary)] transition flex items-center gap-1">Check PNR</Link>
        </div>
      </div>

      <div className="mt-6"><PlayStoreCta url={getSettings().site.playStoreUrl} compact /></div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {prev && (
          <Link href={`/blogs/${prev.slug}?lang=${prev.lang}`} className="glass-card p-4 group">
            <p className="text-xs text-[var(--muted)] mb-1 flex items-center gap-1"><ArrowLeft size={12} /> Newer</p>
            <p className="font-heading font-bold text-sm text-[var(--text)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">{prev.title}</p>
          </Link>
        )}
        {next && (
          <Link href={`/blogs/${next.slug}?lang=${next.lang}`} className="glass-card p-4 group sm:text-right sm:ml-auto">
            <p className="text-xs text-[var(--muted)] mb-1 flex items-center gap-1 sm:justify-end">Older <ArrowRight size={12} /></p>
            <p className="font-heading font-bold text-sm text-[var(--text)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">{next.title}</p>
          </Link>
        )}
      </div>
    </div>
  );
}
