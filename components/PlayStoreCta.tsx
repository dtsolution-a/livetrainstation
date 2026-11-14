import { Smartphone, Star } from 'lucide-react';

/** "Get the Android app" card. `url` comes from the admin settings (defaults to the official Play Store listing). */
export default function PlayStoreCta({ url, compact = false }: { url: string; compact?: boolean }) {
  return (
    <div
      className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/10"
      style={{ padding: compact ? 16 : 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Smartphone size={24} color="var(--on-primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p className="font-heading" style={{ fontWeight: 800, fontSize: compact ? 15 : 18, margin: 0, color: 'var(--text)' }}>
          Live Train Station — get the Android app
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Star size={12} /> Live tracking, PNR alerts & offline station search on your phone
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="premium-btn"
        style={{ padding: '10px 18px', fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        Get it on Google Play
      </a>
    </div>
  );
}
