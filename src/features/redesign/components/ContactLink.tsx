'use client'

import { usePathname } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'

type ContactLinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'>

export function ContactLink(props: ContactLinkProps) {
  const pathname = usePathname()
  // Use one native navigation for cross-page fragments too: the new document
  // lands at its heading without scrolling the outgoing page first.
  return <a {...props} href={pathname === '/' ? '#contacto' : '/#contacto'} />
}
