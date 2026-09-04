import Link from 'next/link'

export interface BreadcrumbItem {
  href?: string
  label: string
}

export function Breadcrumbs({ items, className = '' }: { items: BreadcrumbItem[]; className?: string }) {
  const trail: BreadcrumbItem[] = [{ href: '/', label: 'Inicio' }, ...items]

  return (
    <nav className={`rd-breadcrumbs${className ? ` ${className}` : ''}`} aria-label="Migas de pan">
      <ol>
        {trail.map((item, index) => {
          const isCurrent = index === trail.length - 1
          return (
            <li key={`${item.href ?? 'current'}-${item.label}`}>
              {item.href && !isCurrent ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={isCurrent ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
