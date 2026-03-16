export const IMGS = [
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=75&auto=format",
  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=75&auto=format",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=75&auto=format",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=75&auto=format",
];

export const FBK = [
  "linear-gradient(135deg,#0a1628,#1a3a5c)",
  "linear-gradient(135deg,#0a1a18,#0e3530)",
  "linear-gradient(135deg,#0d0d1a,#1a1a32)",
  "linear-gradient(135deg,#1a1020,#2d1a3e)",
];

export const HERO_GALLERY_AUTOPLAY_MS = 5000;
export const HERO_GALLERY_GRID_MIN = 24;

export const HERO_GALLERY = [
  { k: "chips", title: "M5, M5 Pro y M5 Max.\nUna familia con mucho poder." },
  {
    k: "image",
    title: "Una potente plataforma para la inteligencia artificial.\nCon una mente maravillosa.",
    src: "https://images.unsplash.com/photo-1517232115160-ff93364542dd?w=1600&q=80&auto=format",
    zoom: true,
  },
  {
    k: "image",
    title: "App Teléfono. Sigue en contacto sin tocar el móvil.",
    src: "https://images.unsplash.com/photo-1517959105821-eaf2591984f8?w=1600&q=80&auto=format",
  },
  {
    k: "image",
    title: "Rendimiento de estudio para flujos visuales en tiempo real.",
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80&auto=format",
    zoom: true,
  },
  {
    k: "image",
    title: "Batería para jornadas largas. Rápido cuando lo necesitas.",
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&q=80&auto=format",
  },
];

export const CLOSE_LOOK_ITEMS = [
  {
    label: "Diseño UX/UI",
    desc: "Arquitecturas de experiencia y sistemas visuales con foco en claridad, conversión y producto digital.",
    src: "https://images.unsplash.com/photo-1487014679447-9f8336841d58?w=1500&q=76&auto=format",
  },
  {
    label: "Diseño Arquitectónico",
    desc: "Modelado de espacios, narrativa visual y presentaciones inmersivas para proyectos arquitectónicos.",
    src: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1500&q=76&auto=format",
  },
  {
    label: "Diseño 3D",
    desc: "Pipelines de 3D realtime, optimización de escenas y visualización con motion controlado.",
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1500&q=76&auto=format",
  },
  {
    label: "Research",
    desc: "Entrevistas, pruebas y síntesis para transformar señales de usuario en decisiones de producto.",
    src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1500&q=76&auto=format",
  },
  {
    label: "Investigación docente",
    desc: "Diseño de materiales, experimentación y aprendizaje aplicado a tecnología, UX y desarrollo.",
    src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1500&q=76&auto=format",
  },
  {
    label: "Diseño gráfico",
    desc: "Identidad, composición tipográfica y piezas visuales con criterio editorial y consistencia de marca.",
    src: "https://images.unsplash.com/photo-1502945015378-0e284ca1a5be?w=1500&q=76&auto=format",
  },
  {
    label: "Desarrollo Front",
    desc: "Interfaces web performantes, accesibles y animadas con arquitectura modular orientada a producto.",
    src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1500&q=76&auto=format",
  },
  {
    label: "Desarrollo Back",
    desc: "APIs robustas, integraciones y modelado de datos para escalar funcionalidades de forma fiable.",
    src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1500&q=76&auto=format",
  },
];

export const PROJECTS = [
  {
    id: 0,
    cat: "UX · Product Design",
    title: "LALIGA App",
    sub: "Experiencia para 20M+ usuarios en 150 países.",
    tags: ["Figma", "UX Research"],
    year: "2023–24",
    src: IMGS[0],
    fb: FBK[0],
  },
  {
    id: 1,
    cat: "3D · Arquitectura",
    title: "Estadio Render",
    sub: "SketchUp → UE5 → fotorrealismo 4K.",
    tags: ["UE5", "SketchUp"],
    year: "2024",
    src: IMGS[1],
    fb: FBK[1],
  },
  {
    id: 2,
    cat: "Full Stack",
    title: "Plataforma Angular",
    sub: "Angular + Node.js + MongoDB.",
    tags: ["Angular", "Node.js"],
    year: "2025",
    src: IMGS[2],
    fb: FBK[2],
  },
  {
    id: 3,
    cat: "Branding · Visual",
    title: "Sistema Identidad",
    sub: "Brand system para deporte global.",
    tags: ["Brand", "Figma"],
    year: "2022–24",
    src: IMGS[3],
    fb: FBK[3],
  },
];
