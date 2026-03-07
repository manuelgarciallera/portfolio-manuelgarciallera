// ============================================================
// DATOS DE PROYECTOS — editar aquí para añadir/modificar
// Estructura tipada, placeholders claros hasta tener assets reales
// ============================================================
import type { Project } from '@/types'

export const projects: Project[] = [
  {
    id:          'laliga-design-system',
    slug:        'laliga-design-system',
    title:       'Design System LALIGA',
    subtitle:    'Sistema de diseño escalable para 20M de seguidores',
    category:    'ux',
    role:        'Visual Design Manager · UX Lead',
    tags:        ['Figma', 'Design System', 'UX', 'Angular'],
    thumbnail:   '/images/projects/laliga-ds-thumb.jpg',
    screenshot:  '/images/projects/laliga-ds-screen.jpg',
    color:       '#00C8FF',
    year:        2024,
    featured:    true,
    description: 'Sistema de diseño modular para los productos digitales de LALIGA. Más de 200 componentes, guías de uso y tokens de diseño compartidos entre 8 equipos de producto.',
    url:         undefined,
  },
  {
    id:          'estadio-3d',
    slug:        'estadio-3d',
    title:       'Estadio Interactivo 3D',
    subtitle:    'SketchUp → Web. Navegación en primera persona',
    category:    '3d',
    role:        'ArchViz · Three.js Developer',
    tags:        ['Three.js', 'SketchUp', 'GLB', 'WebGL'],
    thumbnail:   '/images/projects/estadio-thumb.jpg',
    screenshot:  '/images/projects/estadio-screen.jpg',
    model:       '/models/estadio.glb',
    color:       '#5ec4c8',
    year:        2024,
    featured:    true,
    description: 'Visor web interactivo de estadio deportivo. Pipeline completo SketchUp → Blender → GLB → Three.js con navegación orbital y primera persona.',
    url:         undefined,
  },
  {
    id:          'fullstack-app',
    slug:        'fullstack-app',
    title:       'App Full Stack',
    subtitle:    'Angular 17 + Node.js + MongoDB',
    category:    'fullstack',
    role:        'Full Stack Developer',
    tags:        ['Angular', 'Node.js', 'MongoDB', 'TypeScript'],
    thumbnail:   '/images/projects/fullstack-thumb.jpg',
    screenshot:  '/images/projects/fullstack-screen.jpg',
    color:       '#FF2D78',
    year:        2025,
    featured:    true,
    description: 'Aplicación full stack desarrollada en el Máster. CRUD completo con autenticación JWT, Angular 17 con Signals y API REST en Node.js + Express.',
    url:         undefined,
  },
  {
    id:          'branding-project',
    slug:        'branding-project',
    title:       'Identidad de Marca',
    subtitle:    'Branding completo para startup tecnológica',
    category:    'branding',
    role:        'Brand Designer',
    tags:        ['Branding', 'Figma', 'Ilustración', 'Motion'],
    thumbnail:   '/images/projects/branding-thumb.jpg',
    screenshot:  '/images/projects/branding-screen.jpg',
    color:       '#a855f7',
    year:        2023,
    featured:    false,
    description: 'Identidad visual completa: logotipo, sistema de color, tipografía, iconografía y guía de uso de marca.',
    url:         undefined,
  },
]

export const featuredProjects = projects.filter(p => p.featured)
export const getProjectBySlug = (slug: string) => projects.find(p => p.slug === slug)
