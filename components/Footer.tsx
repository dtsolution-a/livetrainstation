import Link from 'next/link';
import { Train, ExternalLink } from 'lucide-react';

const col: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
};

const colHead: React.CSSProperties = {
  fontFamily: "var(--font-heading), sans-serif",
  fontWeight: 700, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--muted)', marginBottom: 4,
};

const colLink: React.CSSProperties = {
  fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
  transition: 'color 0.15s',
};

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        marginTop: 'auto',
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 32,
            marginBottom: 32,
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Train size={16} color="var(--on-primary)" />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-heading), sans-serif",
                  fontWeight: 800, fontSize: 17, color: 'var(--primary)',
                }}
              >
                Live Train Station
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
              India&apos;s smartest railway companion. Real-time train tracking, PNR status, and more.
            </p>
          </div>

          {/* Tools */}
          <div style={col}>
            <p style={colHead}>Tools</p>
            {[
              { href: '/search',         label: 'Search Trains' },
              { href: '/live',           label: 'Live Train Status' },
              { href: '/pnr',            label: 'PNR Status' },
              { href: '/train-info',     label: 'Train Info' },
              { href: '/coach-position', label: 'Coach Position' },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={colLink}>{l.label}</Link>
            ))}
          </div>

          {/* Blog */}
          <div style={col}>
            <p style={colHead}>Blog</p>
            {[
              { href: '/blogs',                          label: 'All Articles' },
              { href: '/blogs/irctc-tatkal-booking-tips',label: 'Tatkal Booking Tips' },
              { href: '/blogs/understanding-pnr-status', label: 'PNR Status Guide' },
              { href: '/blogs/best-train-routes-india',  label: 'Scenic Train Routes' },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={colLink}>{l.label}</Link>
            ))}
          </div>

          {/* Legal */}
          <div style={col}>
            <p style={colHead}>Legal</p>
            {[
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/terms',   label: 'Terms & Conditions' },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={colLink}>{l.label}</Link>
            ))}
          </div>

          {/* App */}
          <div style={col}>
            <p style={colHead}>Get the App</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 8px' }}>
              More features: GPS alarm, offline access, dark mode sync.
            </p>
            <a
              href="#"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 700,
                color: 'var(--primary)', textDecoration: 'none',
              }}
            >
              Download Live Train Station <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 20,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            <p style={{ margin: '0 0 4px' }}>© {new Date().getFullYear()} Live Train Station. All Rights Reserved.</p>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>
              Designed and Developed by <a href="https://dtsolution.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text)', textDecoration: 'underline', textDecorationColor: 'var(--border)' }}>DT Solution</a>
            </p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', margin: 0, textAlign: 'right' }}>
            <p style={{ margin: '0 0 4px' }}>Data powered by Indian Railways.</p>
            <p style={{ margin: 0 }}>Not affiliated with IRCTC or Indian Railways.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
