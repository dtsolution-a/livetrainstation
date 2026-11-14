'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import AppBanner from './AppBanner';

/** Public site chrome. The admin area has its own shell, so hide the site nav/footer there. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <main style={{ flex: 1 }}>{children}</main>;
  }
  return (
    <>
      <AppBanner />
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </>
  );
}
