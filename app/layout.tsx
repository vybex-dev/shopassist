/**
 * app/layout.tsx  (Step 13 — viewport-fit=cover for notched iPhones)
 */

import type { Metadata, Viewport } from "next";
// Suppress TypeScript error for side-effect CSS import when no global d.ts is present
// @ts-ignore: Missing type declarations for CSS import
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopAssist — AI E-Commerce Support",
  description:
    "Intelligent e-commerce support powered by AI. Get instant answers, track orders, and resolve issues 24/7.",
  keywords: ["e-commerce", "support", "AI", "chatbot", "customer service"],
  authors: [{ name: "ShopAssist" }],
  openGraph: {
    title: "ShopAssist — AI E-Commerce Support",
    description:
      "Intelligent AI-powered customer support for modern e-commerce.",
    type: "website",
  },
};

/**
 * viewport-fit=cover  →  content extends edge-to-edge on notched iPhones.
 *                        We then add safe-area padding manually where needed.
 * initialScale=1      →  prevents default iOS scaling that can trigger
 *                        unexpected layout shifts on orientation change.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
