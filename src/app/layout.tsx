import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TB Test Results Explorer",
  description: "Interactive explorer for Bjørn Nyland's EV test data",
  openGraph: {
    siteName: "TB Test Results Explorer",
    type: "website",
    title: "TB Test Results Explorer",
    description: "Interactive explorer for Bjørn Nyland's EV test data",
  },
  twitter: {
    card: "summary_large_image",
    title: "TB Test Results Explorer",
    description: "Interactive explorer for Bjørn Nyland's EV test data",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full`} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "TB Test Results Explorer",
              "url": "https://tb-data.tordar.no",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://tb-data.tordar.no/vehicles/{search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          id="schema-dataset"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Dataset",
              "name": "Bjørn Nyland EV Test Results",
              "description": "1,986 real-world EV test entries across 14 test categories for 663 distinct electric vehicle models, collected by Bjørn Nyland.",
              "url": "https://tb-data.tordar.no",
              "keywords": ["electric vehicle", "EV range test", "EV acceleration", "Bjørn Nyland", "battery degradation"],
              "creator": {
                "@type": "Person",
                "name": "Bjørn Nyland",
                "url": "https://docs.google.com/spreadsheets/d/1V6ucyFGKWuSQzvI8lMzvvWJHrBS82echMVJH37kwgjE/",
              },
              "isAccessibleForFree": true,
              "measurementTechnique": "Standardized real-world road tests",
            }),
          }}
        />
      </head>
      <body className="min-h-full">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Script
          strategy="afterInteractive"
          src="https://cloud.umami.is/script.js"
          data-website-id="13a8fb93-9787-4ecb-ae33-f0c029625b4c"
        />
      </body>
    </html>
  );
}
