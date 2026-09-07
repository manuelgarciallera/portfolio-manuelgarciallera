import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import Script from "next/script";

import { WebVitalsReporter } from "@/components/analytics/WebVitalsReporter";
import {
  PERSON_LEGAL_NAME,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  TWITTER_HANDLE,
  getProfilePageJsonLd,
  getPersonJsonLd,
  getWebsiteJsonLd,
} from "@/lib/site-config";
import "@/styles/globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const websiteJsonLd = JSON.stringify(getWebsiteJsonLd()).replace(/</g, "\\u003c");
const personJsonLd = JSON.stringify(getPersonJsonLd()).replace(/</g, "\\u003c");
const profilePageJsonLd = JSON.stringify(getProfilePageJsonLd()).replace(/</g, "\\u003c");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Product Designer",
    "Diseñador de producto",
    "Design Systems",
    "Sistemas de diseño",
    "Design Engineer",
    "Ingeniería de diseño",
    "HCI",
    "Human-Computer Interaction",
    "Human-AI Interaction",
    "Interacción humano-IA",
    "UX Research",
    "Interaction Design",
    "Figma",
    "Frontend Development",
    "Portfolio UX",
    "Diseño de producto Madrid",
  ],
  authors: [{ name: PERSON_LEGAL_NAME, url: SITE_URL }],
  creator: PERSON_LEGAL_NAME,
  publisher: SITE_NAME,
  category: "Portfolio",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  applicationName: SITE_NAME,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE ? `@${TWITTER_HANDLE.replace(/^@/, "")}` : undefined,
    creator: TWITTER_HANDLE ? `@${TWITTER_HANDLE.replace(/^@/, "")}` : undefined,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={SITE_LANGUAGE} data-theme="dark" className={playfairDisplay.variable} suppressHydrationWarning>
      <head>
        <script id="website-json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
        <script id="person-json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: personJsonLd }} />
        <script id="profile-json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: profilePageJsonLd }} />
        {/* Evita el flash de tema incorrecto */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('rd-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', t);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
