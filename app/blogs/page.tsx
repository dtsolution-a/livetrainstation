import Link from 'next/link';
import { blogPosts } from '@/lib/blogs';
import { BookOpen, Clock, ArrowRight, Tag } from 'lucide-react';

export const metadata = {
  title: 'Blog — Live Train Station | Railway Travel Tips & Guides',
  description: 'Read our expert guides on Indian railways — booking tips, PNR explained, scenic routes, and more.',
};

const tagColors: Record<string, string> = {
  Tips: 'bg-blue-50 text-blue-600',
  Guide: 'bg-purple-50 text-purple-600',
  Travel: 'bg-green-50 text-green-600',
  Reference: 'bg-orange-50 text-orange-600',
};

export default function BlogsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
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

      {/* Featured Post */}
      <Link
        href={`/blogs/${blogPosts[0].slug}`}
        className="glass-card mb-8 overflow-hidden flex flex-col md:flex-row group block"
      >
        <div className="md:w-80 h-52 md:h-auto bg-gradient-to-br from-[#A5E9DD]/40 to-[#34908B]/30 flex items-center justify-center flex-shrink-0">
          <BookOpen size={60} className="text-[var(--primary)] opacity-40" />
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tagColors[blogPosts[0].tag] ?? 'bg-gray-100 text-gray-600'}`}>
              {blogPosts[0].tag}
            </span>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
              <Clock size={12} /> {blogPosts[0].readTime}
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug mb-3">
            {blogPosts[0].title}
          </h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">{blogPosts[0].excerpt}</p>
          <div className="flex items-center gap-2 text-[var(--primary)] font-semibold text-sm">
            Read article <ArrowRight size={14} />
          </div>
        </div>
      </Link>

      {/* Tags Filter UI */}
      <div className="flex flex-wrap gap-2 mb-8">
        <div className="flex items-center gap-1 text-sm text-[var(--muted)]">
          <Tag size={14} />
          <span className="font-semibold">Filter:</span>
        </div>
        {['Tips', 'Guide', 'Travel', 'Reference'].map((tag) => (
          <span
            key={tag}
            className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition ${tagColors[tag] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.slice(1).map((post) => (
          <Link
            key={post.slug}
            href={`/blogs/${post.slug}`}
            className="glass-card overflow-hidden group block flex flex-col"
          >
            <div className="h-40 bg-gradient-to-br from-[#A5E9DD]/30 to-[#34908B]/15 flex items-center justify-center flex-shrink-0">
              <BookOpen size={40} className="text-[var(--primary)] opacity-40" />
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tagColors[post.tag] ?? 'bg-gray-100 text-gray-600'}`}>
                  {post.tag}
                </span>
                <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                  <Clock size={11} /> {post.readTime}
                </span>
              </div>
              <h3 className="font-heading font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug mb-2 flex-1">
                {post.title}
              </h3>
              <p className="text-sm text-[var(--muted)] line-clamp-2 mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">
                Read more <ArrowRight size={12} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Newsletter CTA */}
      <div className="mt-16 rounded-3xl bg-gradient-to-br from-[var(--primary)]/10 to-mint/10 border border-[var(--border)] p-8 text-center">
        <h2 className="font-heading font-extrabold text-2xl mb-2">Stay Updated</h2>
        <p className="text-[var(--muted)] mb-6 text-sm">Get the latest railway tips and guides delivered straight to your inbox.</p>
        <div className="flex gap-3 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
          />
          <button className="premium-btn px-4 py-2.5 text-sm whitespace-nowrap">Subscribe</button>
        </div>
      </div>
    </div>
  );
}
