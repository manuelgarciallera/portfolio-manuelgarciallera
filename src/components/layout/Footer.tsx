import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer
      style={{
        borderTop:  '1px solid var(--divider)',
        padding:    '40px 28px',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          maxWidth:       '1200px',
          margin:         '0 auto',
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          flexWrap:       'wrap',
          gap:            '16px',
        }}
      >
        <p
          style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
            fontSize:   '13px',
            color:      'var(--text-sec)',
          }}
        >
          © {year} Manuel García Llera
        </p>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: 'LinkedIn', href: 'https://linkedin.com/in/manuelgarciallera', external: true },
            { label: 'GitHub',   href: 'https://github.com/manuelgarciallera',     external: true },
            { label: 'Blog',     href: '/blog',                                    external: false },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              style={{
                fontFamily:     "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                fontSize:       '13px',
                color:          'var(--text-sec)',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
