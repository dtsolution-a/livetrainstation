'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Train, Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const mainNavLinks = [
  { href: '/search',         label: 'Search Trains' },
  { href: '/live',           label: 'Live Status' },
  { href: '/station-board',  label: 'Station Board' },
  { href: '/pnr',            label: 'PNR Status' },
  { href: '/train-info',     label: 'Train Info' },
  { href: '/coach-position', label: 'Coach' },
  { href: '/blogs',          label: 'Blogs' },
];

export default function Navbar() {
  const pathname   = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
          gap: '16px',
        }}
      >
        {/* Logo (Left) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              color: 'var(--primary)',
              fontFamily: "var(--font-heading), sans-serif",
              fontWeight: 800,
              fontSize: '18px',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                width: 32, height: 32,
                borderRadius: 10,
                backgroundColor: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Train size={16} color="#fff" />
            </div>
            Live Train Station
          </Link>
        </div>

        {/* Desktop Nav (Center) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          className="hidden-mobile"
        >
          {mainNavLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: "var(--font-body), sans-serif",
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--muted)',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right buttons (Right) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '6px 8px',
              cursor: 'pointer',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className="show-mobile"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '6px 8px',
              cursor: 'pointer',
              color: 'var(--text)',
              display: 'none', // overridden by .show-mobile
              alignItems: 'center',
            }}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            padding: '8px 16px 16px',
          }}
        >
          {mainNavLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  marginBottom: '4px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontFamily: "var(--font-body), sans-serif",
                  fontWeight: 600,
                  fontSize: '15px',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text)',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Inline responsive styles */}
      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile   { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
