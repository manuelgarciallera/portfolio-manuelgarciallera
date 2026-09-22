/** Shared canonical section URLs; existing home fragments remain compatible. */
export const PUBLIC_ROUTES = {
  projects: '/proyectos',
  blog: '/blog',
} as const

export function projectHref(slug: string): string {
  return `${PUBLIC_ROUTES.projects}/${slug}`
}

export function articleHref(slug: string): string {
  return `${PUBLIC_ROUTES.blog}/${slug}`
}
