import { notFound } from 'next/navigation';
import Link from 'next/link';
import { blogPosts, getBlogBySlug } from '@/lib/blogs';
import { Clock, ArrowLeft, ArrowRight, BookOpen, User, Calendar } from 'lucide-react';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.title} — Live Train Station Blog`,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

function renderMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^## (.+)$/gm, '<h2 class="font-heading font-extrabold text-2xl mt-10 mb-4 text-[var(--text)]">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="font-heading font-bold text-xl mt-8 mb-3 text-[var(--text)]">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    // Tables
    .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_, header, rows) => {
      const thCells = header.split('|').filter((c: string) => c.trim()).map((c: string) => `<th class="text-left py-2 px-3 font-bold text-xs uppercase tracking-wider text-[var(--muted)]">${c.trim()}</th>`).join('');
      const trs = rows.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="py-2 px-3 text-sm border-t border-[var(--border)]">${c.trim()}</td>`).join('');
        return `<tr class="hover:bg-[var(--border)]/30">${tds}</tr>`;
      }).join('');
      return `<div class="overflow-x-auto my-6"><table class="w-full glass-card"><thead><tr class="bg-[var(--border)]/50">${thCells}</tr></thead><tbody>${trs}</tbody></table></div>`;
    })
    // List items (unordered)
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 text-sm text-[var(--text)]"><span class="text-[var(--primary)] mt-0.5">•</span><span>$1</span></li>')
    // List items (ordered)
    .replace(/^\d+\. (.+)$/gm, '<li class="text-sm text-[var(--text)] ml-4">$1</li>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-[var(--border)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--primary)]">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[var(--primary)] underline hover:opacity-80">$1</a>')
    // Emojis in lines
    .replace(/^(❌|✅|🚀|🟢|🟡|🔴|🔵|⚪) (.+)$/gm, '<p class="flex items-start gap-2 my-1"><span>$1</span><span class="text-sm">$2</span></p>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-[var(--text)] leading-relaxed mb-4 text-[15px]" style="font-family: \'Poppins\', sans-serif;">')
    .replace(/^(?!<)(.+)$/gm, '$1');
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) notFound();

  const currentIdx = blogPosts.findIndex(p => p.slug === slug);
  const prev = currentIdx > 0 ? blogPosts[currentIdx - 1] : null;
  const next = currentIdx < blogPosts.length - 1 ? blogPosts[currentIdx + 1] : null;

  const tagColors: Record<string, string> = {
    Tips: 'bg-blue-50 text-blue-600',
    Guide: 'bg-purple-50 text-purple-600',
    Travel: 'bg-green-50 text-green-600',
    Reference: 'bg-orange-50 text-orange-600',
  };

  const htmlContent = renderMarkdown(post.content);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-8">
        <Link href="/blogs" className="hover:text-[var(--primary)] flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> Blog
        </Link>
        <span>/</span>
        <span className="text-[var(--text)] truncate">{post.title}</span>
      </div>

      {/* Hero */}
      <div className="h-56 rounded-3xl bg-gradient-to-br from-[#A5E9DD]/40 to-[#34908B]/20 flex items-center justify-center mb-8">
        <BookOpen size={64} className="text-[var(--primary)] opacity-30" />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tagColors[post.tag] ?? 'bg-gray-100 text-gray-600'}`}>
          {post.tag}
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
          <Clock size={12} /> {post.readTime}
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
          <Calendar size={12} /> {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
          <User size={12} /> {post.author}
        </span>
      </div>

      <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-[var(--text)] leading-tight mb-6">
        {post.title}
      </h1>
      <p className="text-lg text-[var(--muted)] leading-relaxed mb-10 border-l-4 border-[var(--primary)] pl-4">
        {post.excerpt}
      </p>

      {/* Article Content */}
      <article
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{
          __html: `<p class="text-[var(--text)] leading-relaxed mb-4 text-[15px]">${htmlContent}</p>`,
        }}
      />

      {/* CTA */}
      <div className="mt-12 p-6 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
        <h3 className="font-heading font-bold text-lg mb-2">Try Live Train Station Now</h3>
        <p className="text-sm text-[var(--muted)] mb-4">Track your train in real-time, check PNR status, and more — free, no sign-up required.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/live" className="premium-btn text-sm px-4 py-2 flex items-center gap-1">
            Live Train Status <ArrowRight size={14} />
          </Link>
          <Link href="/pnr" className="text-sm px-4 py-2 rounded-xl border border-[var(--primary)] text-[var(--primary)] font-bold hover:bg-[var(--primary)] hover:text-white transition flex items-center gap-1">
            Check PNR
          </Link>
        </div>
      </div>

      {/* Post Navigation */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {prev && (
          <Link href={`/blogs/${prev.slug}`} className="glass-card p-4 group">
            <p className="text-xs text-[var(--muted)] mb-1 flex items-center gap-1">
              <ArrowLeft size={12} /> Previous
            </p>
            <p className="font-heading font-bold text-sm text-[var(--text)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
              {prev.title}
            </p>
          </Link>
        )}
        {next && (
          <Link href={`/blogs/${next.slug}`} className="glass-card p-4 group sm:text-right sm:ml-auto">
            <p className="text-xs text-[var(--muted)] mb-1 flex items-center gap-1 sm:justify-end">
              Next <ArrowRight size={12} />
            </p>
            <p className="font-heading font-bold text-sm text-[var(--text)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
              {next.title}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
