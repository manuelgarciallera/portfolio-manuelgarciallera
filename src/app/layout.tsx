import type { Metadata, Viewport } from "next";

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
  keywords: ["UX Design", "UI Design", "Full Stack", "Three.js", "ArchViz", "LALIGA", "React", "Angular"],
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
    <html lang={SITE_LANGUAGE} data-theme="dark" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personJsonLd }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: profilePageJsonLd }} />
        {/* Evita el flash de tema incorrecto */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme') || 'dark';
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
