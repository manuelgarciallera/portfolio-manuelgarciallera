import type { ReactNode } from 'react'

import { Breadcrumbs } from './Breadcrumbs'
import styles from './page-intro.module.css'

interface PageIntroProps {
  label: string
  title: ReactNode
  lead: ReactNode
  children?: ReactNode
  variant?: 'standard' | 'projects' | 'blog'
}

export function PageIntro({ label, title, lead, children, variant = 'standard' }: PageIntroProps) {
  return (
    <header className={`rd-page-intro ${styles.root}`} data-variant={variant}>
      <Breadcrumbs items={[{ label }]} />
      <p className={`rd-label ${styles.label}`}>{label}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{lead}</p>
      {children ? <div className={`rd-prose ${styles.body}`}>{children}</div> : null}
    </header>
  )
}
