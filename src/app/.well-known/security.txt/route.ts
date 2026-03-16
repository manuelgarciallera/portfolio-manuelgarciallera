import { NextResponse } from "next/server";

import { SITE_EMAIL, SITE_URL } from "@/lib/site-config";

export function GET() {
  const body = [
    `Contact: mailto:${SITE_EMAIL}`,
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/`,
    "Preferred-Languages: es, en",
    `Expires: 2027-12-31T23:59:59.000Z`,
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
