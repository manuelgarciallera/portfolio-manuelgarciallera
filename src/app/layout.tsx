import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Manuel García Llera — Visual Design & Full Stack',
    template: '%s | Manuel García Llera',
  },
  description: 'Visual Design Manager en LALIGA. UX/UI, producto, 3D arquitectónico y desarrollo full stack.',
  keywords: ['UX Design', 'UI Design', 'Full Stack', 'Three.js', 'ArchViz', 'LALIGA', 'React', 'Angular'],
  authors: [{ name: 'Manuel García Llera' }],
  creator: 'Manuel García Llera',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://manuelgarciallera.com',
    siteName: 'Manuel García Llera',
    title: 'Manuel García Llera — Visual Design & Full Stack',
    description: 'Visual Design Manager en LALIGA. UX/UI, producto, 3D arquitectónico y desarrollo full stack.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manuel García Llera',
    description: 'Visual Design Manager en LALIGA. UX/UI, producto, 3D arquitectónico y full stack.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
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
        {children}
      </body>
    </html>
  )
}
