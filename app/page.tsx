'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Radio, Ticket, Train, ArrowRight, BookOpen, Zap, MapPin, Clock, Star, Map } from 'lucide-react';

const S = {
  page: { maxWidth: 1200 } as React.CSSProperties,
} as const;

const popularTrains = [
  { no: '12951', name: 'Mumbai Rajdhani Express' },
  { no: '22436', name: 'Vande Bharat Express' },
  { no: '12004', name: 'Swarna Shatabdi Express' },
  { no: '19091', name: 'Bandra Gorakhpur Humsafar' },
  { no: '12269', name: 'Duronto Express' },
  { no: '12903', name: 'Golden Temple Mail' },
  { no: '12809', name: 'Howrah Mail' },
  { no: '12627', name: 'Karnataka Express' }
];

const quickActions = [
  { href: '/search',    icon: Search, label: 'Search Trains',  desc: 'Find trains between stations',  accent: '#3B82F6' },
  { href: '/live',      icon: Radio,  label: 'Live Status',    desc: 'Real-time train tracking',       accent: '#10B981' },
  { href: '/pnr',       icon: Ticket, label: 'PNR Status',     desc: 'Check your booking status',      accent: '#F59E0B' },
  { href: '/train-info',icon: Train,  label: 'Train Info',     desc: 'Schedule, route & stops',        accent: '#8B5CF6' },
  { href: '/coach-position',icon: Map,label: 'Coach Position', desc: 'Check seat maps & layout',       accent: '#EC4899' },
];

const features = [
  { icon: Zap,    title: 'Real-time Data',    desc: 'Live train positions updated every few minutes directly from railway systems.' },
  { icon: MapPin, title: 'Station Coverage',  desc: 'All Indian railway stations covered with complete route and schedule data.' },
  { icon: Clock,  title: 'Delay Tracking',    desc: 'Know exact delays at each station, so you plan your pickup and drop-off better.' },
  { icon: Star,   title: 'No Signup Needed',  desc: 'All features available instantly — no account, no sign-up, completely free.' },
];

const blogPreviews = [
  { slug: 'irctc-tatkal-booking-tips', tag: 'Tips', tagColor: '#3B82F6', title: 'How to Book Tatkal Tickets on IRCTC: Complete Guide', excerpt: 'Step-by-step guide to successfully book Tatkal tickets during peak hours.', readTime: '5 min read' },
  { slug: 'understanding-pnr-status', tag: 'Guide', tagColor: '#8B5CF6', title: 'Understanding PNR Status: CNF, RAC, WL Explained', excerpt: 'What do CNF, RAC, WL, GNWL, PQWL mean? A plain-language explanation.', readTime: '4 min read' },
  { slug: 'best-train-routes-india', tag: 'Travel', tagColor: '#10B981', title: 'Top 10 Scenic Train Routes in India You Must Experience', excerpt: "From Konkan Railway to Darjeeling — India's most breathtaking rail journeys.", readTime: '7 min read' },
];

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent, value?: string) => {
    if (e) e.preventDefault();
    const v = (value || q).trim();
    if (!v) return;
    setShowSuggestions(false);
    if (/^\d{10}$/.test(v)) router.push(`/pnr?pnr=${v}`);
    else if (/^\d{5}$/.test(v)) router.push(`/live?train=${v}`);
    else router.push(`/train-info?train=${v}`);
  };

  const filteredTrains = q.length > 0 
    ? popularTrains.filter(t => t.no.includes(q) || t.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
    : popularTrains.slice(0, 4);

  return (
    <div style={{ fontFamily: "var(--font-body), sans-serif" }}>

      {/* ── Gorgeous Hero Section ── */}
      <section
        style={{
          position: 'relative',
          padding: '120px 24px 100px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg)',
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ position: 'absolute', top: -150, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'var(--primary)', filter: 'blur(200px)', opacity: 0.1, borderRadius: '50%' }} />

        <div style={{ maxWidth: S.page.maxWidth, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {/* Live badge */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--primary)', padding: '6px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 800, marginBottom: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block', boxShadow: '0 0 8px var(--primary)' }} />
            Live Train Tracking Available
          </div>

          <h1
            style={{
              fontFamily: "var(--font-heading), sans-serif",
              fontSize: 'clamp(44px, 7vw, 76px)', fontWeight: 800, color: 'var(--text)',
              lineHeight: 1.05, margin: '0 0 24px', letterSpacing: '-0.03em'
            }}
          >
            India&apos;s Smartest<br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #10B981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Railway Companion
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--muted)', lineHeight: 1.6,
              margin: '0 auto 48px', maxWidth: 640, fontWeight: 500
            }}
          >
            Track trains in real-time, instantly check PNR status, seat availability, and fare calculation — seamlessly all in one place.
          </p>

          {/* Quick search floating card */}
          <div ref={wrapperRef} style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
            <form 
              onSubmit={e => handleSearch(e)} 
              style={{ 
                display: 'flex', flexWrap: 'wrap', gap: 8, 
                background: 'var(--surface)', padding: 12, 
                borderRadius: 24, border: '1px solid var(--border)', 
                boxShadow: '0 24px 48px rgba(0,0,0,0.08)' 
              }}
            >
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <Search size={20} color="var(--muted)" style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="rail-input"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Train No, Name or PNR (10 digits)…"
                  style={{ 
                    width: '100%', borderRadius: 16, fontSize: 16, 
                    padding: '18px 20px 18px 56px', border: 'none', 
                    background: 'var(--bg)', fontWeight: 600,
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' 
                  }}
                />
              </div>
              <button type="submit" className="premium-btn" style={{ borderRadius: 16, padding: '16px 36px', fontSize: 16, flex: '1 1 140px' }}>
                Track Now
              </button>
            </form>

            {/* Auto Suggestions Dropdown */}
            {showSuggestions && (
              <div style={{ 
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, 
                background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden', textAlign: 'left', zIndex: 50 
              }}>
                {filteredTrains.length > 0 ? (
                  <>
                    <div style={{ padding: '10px 16px', background: 'var(--bg)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      {q ? 'Suggestions' : 'Popular Trains'}
                    </div>
                    {filteredTrains.map(t => (
                      <div 
                        key={t.no} 
                        onClick={() => { setQ(t.no); handleSearch(null as any, t.no); }}
                        style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ background: 'rgba(52,144,139,0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
                          {t.no}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                          {t.name}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                    No exact train found in popular list. Press enter to search online.
                  </div>
                )}
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 16, fontWeight: 600 }}>
            <span style={{ color: 'var(--primary)' }}>Tip:</span> 5-digits for Live Status · 10-digits for PNR
          </p>
        </div>
      </section>

      {/* ── Quick Access (6 Cards) ── */}
      <section data-reveal style={{ maxWidth: S.page.maxWidth, margin: '0 auto', padding: '60px 24px 0' }}>
        <h2 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 24px' }}>
          Explore Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, height: '100%' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: a.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <a.icon size={24} color={a.accent} />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)', margin: '0 0 4px' }}>{a.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{a.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why RailSaathi (Inverted Theme) ── */}
      <section data-reveal style={{ backgroundColor: 'var(--text)', color: 'var(--bg)', marginTop: 60, padding: '80px 24px' }}>
        <div style={{ maxWidth: S.page.maxWidth, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--bg)', textAlign: 'center', margin: '0 0 12px' }}>
            Why Live Train Station?
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--bg)', opacity: 0.8, fontSize: 16, margin: '0 0 48px' }}>
            Built for Indian travellers, by Indian travellers.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {features.map((f) => (
              <div key={f.title} style={{ textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <f.icon size={32} color="var(--primary)" />
                </div>
                <p style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--bg)', margin: '0 0 8px' }}>{f.title}</p>
                <p style={{ fontSize: 14, color: 'var(--bg)', opacity: 0.7, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── From the Blog ── */}
      <section data-reveal style={{ maxWidth: S.page.maxWidth, margin: '0 auto', padding: '80px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Latest from the Blog
          </h2>
          <Link href="/blogs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {blogPreviews.map((p) => (
            <Link key={p.slug} href={`/blogs/${p.slug}`} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 160, background: 'linear-gradient(135deg, rgba(165,233,221,0.35) 0%, rgba(52,144,139,0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={48} color="var(--primary)" style={{ opacity: 0.4 }} />
                </div>
                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.tagColor, backgroundColor: p.tagColor + '18', padding: '4px 10px', borderRadius: 999 }}>{p.tag}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{p.readTime}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.4, flex: 1 }}>{p.title}</p>
                  <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }} className="line-clamp-2">{p.excerpt}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section data-reveal style={{ maxWidth: S.page.maxWidth, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #2a7571 100%)', borderRadius: 28, padding: 'clamp(40px, 6vw, 64px)', textAlign: 'center', color: '#fff', boxShadow: '0 20px 40px rgba(52,144,139,0.2)' }}>
          <h2 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, margin: '0 0 16px' }}>
            Get the Live Train Station App
          </h2>
          <p style={{ opacity: 0.9, margin: '0 auto 32px', fontSize: 17, maxWidth: 500, lineHeight: 1.6 }}>
            GPS-based station alarm, offline route cache, and more features — exclusively in our mobile app.
          </p>
          <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: '#fff', color: 'var(--primary)', fontWeight: 800, fontSize: 16, padding: '16px 32px', borderRadius: 14, textDecoration: 'none', transition: 'transform 0.2s', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
            Download Now <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}
