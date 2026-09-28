import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Live Train Station — Live Train Tracking & PNR Status",
  description:
    "Track live train status, check PNR status, search trains between stations, get fare info and more. India's smartest railway companion.",
  keywords:
    "live train status, PNR status, train search, Indian railways, IRCTC, train tracking",
  openGraph: {
    title: "Live Train Station — Live Train Tracking & PNR Status",
    description:
      "India's smartest railway companion — live tracking, PNR check, fare lookup, and more.",
    type: "website",
  },
};

import { Bricolage_Grotesque, Poppins } from 'next/font/google';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <ScrollReveal />
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
