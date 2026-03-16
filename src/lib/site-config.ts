const FALLBACK_SITE_URL = "https://manuelgarciallera.com";

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const SITE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL);
export const SITE_NAME = "Manuel Garc\u00EDa Llera";
export const SITE_TITLE = "Manuel Garc\u00EDa Llera - Visual Design & Full Stack";
export const SITE_DESCRIPTION =
  "Visual Design Manager en LALIGA. UX/UI, producto, 3D arquitect\u00F3nico y desarrollo full stack.";
export const SITE_LOCALE = "es_ES";
export const SITE_EMAIL = "hola@manuelgarciallera.com";
export const SITE_LINKEDIN = "https://www.linkedin.com/in/manuelgarciallera/";
export const SITE_GITHUB = "https://github.com/manuelgarciallera";

export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "es",
  };
}

export function getPersonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    email: SITE_EMAIL,
    sameAs: [SITE_LINKEDIN, SITE_GITHUB],
    jobTitle: "Visual Design Manager",
    worksFor: {
      "@type": "Organization",
      name: "LALIGA",
    },
    knowsAbout: [
      "UX/UI Design",
      "Product Design",
      "3D Architecture Visualization",
      "Three.js",
      "React",
      "Angular",
      "Full Stack Development",
    ],
  };
}

