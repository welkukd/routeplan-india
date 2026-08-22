import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RoutePlan India — Circuit for Indian SMBs",
  description: "WhatsApp-first routing and dispatch SaaS for dairy, pharmacy, bakery, and kirana businesses. Built for India, free tier only.",
  keywords: ["routing", "dispatch", "WhatsApp", "SMB", "India", "logistics", "delivery"],
  authors: [{ name: "RoutePlan India" }],
  creator: "RoutePlan India",
  publisher: "RoutePlan India",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://routeplan-india.vercel.app",
    title: "RoutePlan India — Circuit for Indian SMBs",
    description: "WhatsApp-first routing and dispatch SaaS for dairy, pharmacy, bakery, and kirana businesses.",
    siteName: "RoutePlan India",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoutePlan India — Circuit for Indian SMBs",
    description: "WhatsApp-first routing and dispatch SaaS for Indian SMBs.",
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#08090a" },
    { media: "(prefers-color-scheme: dark)", color: "#08090a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}