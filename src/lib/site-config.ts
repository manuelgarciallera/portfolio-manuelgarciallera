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
export const PERSON_DISPLAY_NAME = "Manuel Garc\u00EDa Llera";
export const SITE_NAME = PERSON_DISPLAY_NAME;
export const SITE_TITLE = `${PERSON_DISPLAY_NAME} - Visual Design & Full Stack`;
export const SITE_DESCRIPTION =
  "Portfolio profesional de Manuel Garc\u00EDa-Llera A\u00F1\u00F3n. Visual Design, UX/UI, Product Design, Research, Dise\u00F1o 3D arquitect\u00F3nico y desarrollo full stack.";

export const SITE_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hola@manuelgarciallera.com";
export const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE || "";

export const PROFILE_LINKS = {
  linkedin: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_LINKEDIN) || "https://www.linkedin.com/in/manuelgarciallera/",
  github: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_GITHUB) || "https://github.com/manuelgarciallera",
  medium: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_MEDIUM),
  orcid: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_ORCID),
  behance: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_BEHANCE),
  dribbble: cleanOptionalUrl(process.env.NEXT_PUBLIC_PROFILE_DRIBBBLE),
} as const;

export const SITE_SOCIAL_URLS = dedupe([
  PROFILE_LINKS.linkedin,
  PROFILE_LINKS.github,
  PROFILE_LINKS.medium,
  PROFILE_LINKS.orcid,
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
    image: `${SITE_URL}/opengraph-image`,
    email: SITE_EMAIL,
    sameAs: SITE_SOCIAL_URLS,
    jobTitle: "Visual Design Manager",
    worksFor: {
      "@type": "Organization",
      name: "LALIGA",
    },
    knowsAbout: [
      "Visual Design",
      "UX/UI Design",
      "Product Design",
      "Research",
      "Usability Studies",
      "Graphic Design",
      "3D Architecture Visualization",
      "Three.js",
      "React",
      "Angular",
      "Full Stack Development",
    ],
  };
}

export function getProfilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: SITE_TITLE,
    url: SITE_URL,
    inLanguage: SITE_LANGUAGE,
    mainEntity: getPersonJsonLd(),
  };
}
