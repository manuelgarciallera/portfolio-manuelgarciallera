import { NextResponse } from "next/server";

import { PERSON_LEGAL_NAME, PROFILE_LINKS, SITE_URL } from "@/lib/site-config";

export function GET() {
  const body = [
    "/* TEAM */",
    `Developer, Designer: ${PERSON_LEGAL_NAME}`,
    `Site: ${SITE_URL}`,
    "",
    "/* CONTACT */",
    `LinkedIn: ${PROFILE_LINKS.linkedin}`,
    `GitHub: ${PROFILE_LINKS.github}`,
    PROFILE_LINKS.medium ? `Medium: ${PROFILE_LINKS.medium}` : null,
    PROFILE_LINKS.orcid ? `ORCID: ${PROFILE_LINKS.orcid}` : null,
    "",
    "/* TECH */",
    "Next.js, React, Three.js, GSAP, TailwindCSS",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
