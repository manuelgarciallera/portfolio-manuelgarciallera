import type { Metadata } from "next";

import { TheatreLabView } from "@/features/portfolio/integrations/theatre/TheatreLabView";

export const metadata: Metadata = {
  title: "Lab Theatre",
  description: "Sandbox Theatre.js + Three.js para secuenciación visual de motion en el portfolio.",
  robots: { index: false, follow: false },
};

export default function TheatreLabPage() {
  return <TheatreLabView />;
}
