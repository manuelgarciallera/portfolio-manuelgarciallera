import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-config";
import { ARTICLES } from "@/features/redesign/content/articles";
import { getPublishedCases } from "@/features/redesign/content/cases";

export default function sitemap(): MetadataRoute.Sitemap {
  // Omit lastModified until a verified per-page editorial update date exists.
  // Publication dates and build times do not establish the last content change.

  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    { url: `${SITE_URL}/casos`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/investigacion`, changeFrequency: "monthly", priority: 0.86 },
    { url: `${SITE_URL}/sobre-mi`, changeFrequency: "monthly", priority: 0.72 },
    { url: `${SITE_URL}/proceso`, changeFrequency: "monthly", priority: 0.74 },
    { url: `${SITE_URL}/articulos`, changeFrequency: "monthly", priority: 0.8 },
    ...ARTICLES.map(({ slug }) => ({ url: `${SITE_URL}/articulos/${slug}`, changeFrequency: "monthly" as const, priority: 0.72 })),
    ...getPublishedCases().map(({ slug }) => ({ url: `${SITE_URL}/casos/${slug}`, changeFrequency: "monthly" as const, priority: 0.85 })),
  ];
}
