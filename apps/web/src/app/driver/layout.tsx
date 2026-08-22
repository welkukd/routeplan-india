"use client";

import { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useDriverStore } from "./store";

export default function DriverLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { language } = useDriverStore();

  useEffect(() => {
    setMounted(true);
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/driver/sw.js").catch(console.error);
    }
  }, []);

  if (!mounted) return null;

  return (
    <>
      <head>
        <meta name="theme-color" content="#fbbf24" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RoutePlan Driver" />
        <link rel="manifest" href="/driver/manifest.json" />
        <link rel="apple-touch-icon" href="/driver/icon-192.png" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </>
  );
}