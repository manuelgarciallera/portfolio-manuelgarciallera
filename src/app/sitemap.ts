import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-config";
import { ARTICLES } from "@/features/redesign/content/articles";
import { getPublishedCases } from "@/features/redesign/content/cases";

export default function sitemap(): MetadataRoute.Sitemap {
  const portfolioUpdatedAt = new Date("2026-09-02");

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: portfolioUpdatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    { url: `${SITE_URL}/casos`, lastModified: portfolioUpdatedAt, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/sobre-mi`, lastModified: portfolioUpdatedAt, changeFrequency: "monthly", priority: 0.72 },
    { url: `${SITE_URL}/proceso`, lastModified: portfolioUpdatedAt, changeFrequency: "monthly", priority: 0.74 },
    { url: `${SITE_URL}/articulos`, lastModified: portfolioUpdatedAt, changeFrequency: "monthly", priority: 0.8 },
    ...ARTICLES.map(({ slug, publishedAt }) => ({ url: `${SITE_URL}/articulos/${slug}`, lastModified: new Date(publishedAt), changeFrequency: "monthly" as const, priority: 0.72 })),
    ...getPublishedCases().map(({ slug }) => ({ url: `${SITE_URL}/casos/${slug}`, lastModified: portfolioUpdatedAt, changeFrequency: "monthly" as const, priority: 0.85 })),
  ];
}
