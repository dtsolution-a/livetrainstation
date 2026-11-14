import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Bricolage_Grotesque, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SiteChrome from "@/components/SiteChrome";
import { SiteConfigProvider } from "@/components/SiteConfig";
import ScrollReveal from "@/components/ScrollReveal";
import { getSettings } from "@/lib/server/settings";
import { pageMetadata } from "@/lib/server/seo";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-heading" });
const poppins = Poppins({ weight: ["400", "500", "600", "700", "800"], subsets: ["latin"], display: "swap", variable: "--font-body" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#34908B" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

/** Site-wide metadata. The proxy passes the request path so admin-edited SEO per page applies. */
export async function generateMetadata(): Promise<Metadata> {
  const path = (await headers()).get("x-pathname") || "/";
  const s = getSettings();
  const base = pageMetadata(path.replace(/\/+$/, "") || "/");
  return {
    ...base,
    title: base.title ?? "Live Train Station — Live Train Tracking & PNR Status",
    keywords: "live train status, PNR status, train search, Indian railways, IRCTC, train tracking",
    applicationName: s.seo.siteName,
    verification: {
      google: s.seo.googleVerification || undefined,
      other: s.seo.bingVerification ? { "msvalidate.01": s.seo.bingVerification } : undefined,
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { analytics, site } = getSettings();
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${poppins.variable}`}>
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg)",
          color: "var(--text)",
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        <ThemeProvider>
          <SiteConfigProvider value={{ playStoreUrl: site.playStoreUrl, showAppBanner: site.showAppBanner }}>
            <ScrollReveal />
            <SiteChrome>{children}</SiteChrome>
          </SiteConfigProvider>
        </ThemeProvider>

        {analytics.ga4 && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${analytics.ga4}`} strategy="afterInteractive" nonce={nonce} />
            <Script id="ga4" strategy="afterInteractive" nonce={nonce}>
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${analytics.ga4}',{anonymize_ip:true});`}
            </Script>
          </>
        )}
        {analytics.gtm && (
          <Script id="gtm" strategy="afterInteractive" nonce={nonce}>
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${analytics.gtm}');`}
          </Script>
        )}
        {analytics.clarity && (
          <Script id="clarity" strategy="afterInteractive" nonce={nonce}>
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${analytics.clarity}");`}
          </Script>
        )}
      </body>
    </html>
  );
}
