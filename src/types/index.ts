// ============================================================
// TIPOS GLOBALES — fuente de verdad de interfaces del proyecto
// ============================================================

export type ProjectCategory = 'ux' | '3d' | 'fullstack' | 'branding'

export interface Project {
  id: string
  title: string
  subtitle: string
  category: ProjectCategory
  role: string
  tags: string[]
  thumbnail: string
  screenshot?: string   // para mockup de dispositivo
  model?: string        // ruta al .glb (solo proyectos 3D)
  color: string         // color accent del proyecto
  year: number
  featured: boolean
  slug: string
  description: string
  url?: string
}

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  tags: string[]
  readingTime: number
  published: boolean
  coverImage?: string
}

export interface NavItem {
  label: string
  href: string
  external?: boolean
}

export type Theme = 'dark' | 'light'

export interface SkillGroup {
  category: string
  skills: string[]
}
