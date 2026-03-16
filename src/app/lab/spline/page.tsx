import type { Metadata } from "next";

import { SplineLabView } from "@/features/portfolio/integrations/spline/SplineLabView";

export const metadata: Metadata = {
  title: "Lab Spline",
  description: "Sandbox para integrar y validar escenas de app.spline.design dentro del portfolio.",
  robots: { index: false, follow: false },
};

export default function SplineLabPage() {
  return <SplineLabView />;
}
