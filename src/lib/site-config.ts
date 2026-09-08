const FALLBACK_SITE_URL = "https://manuelgarciallera.com";

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function cleanOptionalUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

function dedupe(items: Array<string | null | undefined>): string[] {
  const clean = items.filter(Boolean) as string[];
  return Array.from(new Set(clean));
}

export const SITE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL);
export const SITE_HANDLE = "manuelgarciallera";
export const SITE_LOCALE = "es_ES";
export const SITE_LANGUAGE = "es";

export const PERSON_LEGAL_NAME = "Manuel Garc\u00EDa-Llera A\u00F1\u00F3n";
export const PERSON_DISPLAY_NAME = "Manuel Garc\u00EDa-Llera";
export const SITE_NAME = PERSON_DISPLAY_NAME;
export const SITE_TITLE = `${PERSON_DISPLAY_NAME} — Product Designer, Design Systems y HCI`;
export const SITE_DESCRIPTION =
  "Manuel Garc\u00EDa-Llera, Product Designer y Design Engineer: sistemas de dise\u00F1o, HCI e interacci\u00F3n humano-IA, del prototipo al producto implementado.";

export const SITE_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@manuelgarciallera.com";
export const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE || "";
// La imagen de la entidad debe vivir en el dominio propio: un avatar de GitHub es
// una URL de terceros que puede cambiar o desaparecer sin aviso, y deja la unica
// senal visual de la identidad fuera de control.
export const PROFILE_IMAGE_URL = `${SITE_URL}/images/manuel-garcia-llera.jpg`;

// Next reemplaza el objeto `openGraph` completo cuando una ruta lo declara, no lo
// fusiona con el de la raiz. Cada pagina que declare `openGraph` tiene que incluir
// su imagen o se comparte sin previsualizacion; este descriptor evita repetirla.
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: SITE_TITLE,
} as const;

export const PROFILE_LINKS = {
  linkedin: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_LINKEDIN) || "https://www.linkedin.com/in/manuelgarciallera/",
  github: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_GITHUB) || "https://github.com/manuelgarciallera",
  medium: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_MEDIUM),
  // ORCID y Scholar son las dos senales que conectan el nombre con la identidad
  // academica en los grafos de conocimiento. Sin valor por defecto, el hueco
  // existia en el tipo pero nunca llegaba a sameAs.
  orcid: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_ORCID) || "https://orcid.org/0009-0009-5893-0343",
  scholar:
    cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_SCHOLAR) ||
    "https://scholar.google.com/citations?user=oVTgxPMAAAAJ",
  behance: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_BEHANCE),
  dribbble: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_DRIBBBLE),
} as const;

export const SITE_SOCIAL_URLS = dedupe([
  PROFILE_LINKS.linkedin,
  PROFILE_LINKS.github,
  PROFILE_LINKS.medium,
  PROFILE_LINKS.orcid,
  PROFILE_LINKS.scholar,
  PROFILE_LINKS.behance,
  PROFILE_LINKS.dribbble,
]);

export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: [PERSON_LEGAL_NAME, SITE_HANDLE],
    url: SITE_URL,
    inLanguage: SITE_LANGUAGE,
  };
}

export function getPersonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON_LEGAL_NAME,
    alternateName: dedupe([PERSON_DISPLAY_NAME, "Manuel Garcia-Llera Anon", "Manuel Garcia Llera", SITE_HANDLE]),
    givenName: "Manuel",
    familyName: "Garc\u00EDa-Llera A\u00F1\u00F3n",
    url: SITE_URL,
    image: PROFILE_IMAGE_URL,
    sameAs: SITE_SOCIAL_URLS,
    jobTitle: "Product Designer y Design Engineer especializado en HCI",
    // El empleador y la formacion no son adorno: son las aristas que conectan esta
    // entidad con otras ya conocidas por los grafos, y sin ellas el nombre queda
    // suelto. LALIGA es publico en su perfil profesional; no se afirma nada mas.
    worksFor: {
      "@type": "Organization",
      name: "LALIGA",
      url: "https://www.laliga.com/",
    },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "Universidad Rey Juan Carlos", url: "https://www.urjc.es/" },
      { "@type": "CollegeOrUniversity", name: "Universidad Internacional de La Rioja", url: "https://www.unir.net/" },
    ],
    knowsAbout: [
      "Product Design",
      "Design Systems",
      "Human-Computer Interaction",
      "Human-AI Interaction",
      "User Experience Research",
      "Human-Centered Design",
      "Usability",
      "Accessibility",
      "Interaction Design",
      "Design Engineering",
      // Sin estas, el grafo describia a un disenador de producto con stack y perdia
      // justo la mitad que distingue el perfil: la que investiga.
      "Design Theory",
      "Design History",
      "Material Culture",
      "Haptic Design",
      "Research through Design",
      "Figma",
      "React",
      "Angular",
      "Full Stack Development",
    ],
  };
}

/**
 * `ProfilePage` describe LA pagina de perfil, no el sitio entero. Vivia en el
 * layout raiz, asi que /casos, /proceso y /articulos se declaraban a si mismas
 * pagina de perfil de Manuel: tres afirmaciones falsas por cada visita de un
 * rastreador. Se emite solo desde /sobre-mi, y con su URL, no con la del dominio.
 */
export function getProfilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: SITE_TITLE,
    url: `${SITE_URL}/sobre-mi`,
    inLanguage: SITE_LANGUAGE,
    mainEntity: getPersonJsonLd(),
  };
}
