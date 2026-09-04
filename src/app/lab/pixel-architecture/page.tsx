import type { Metadata } from 'next'

import { PixelArchitectureLab } from '@/features/redesign/lab/PixelArchitectureLab'
import '@/features/redesign/lab/pixel-architecture.css'

export const metadata: Metadata = {
  title: 'Laboratorio · Arquitectura de píxeles',
  robots: { index: false, follow: false },
}

export default function PixelArchitecturePage() {
  return <PixelArchitectureLab />
}
