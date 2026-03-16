import { useEffect, useState } from "react";

const DEFAULT_VIEWPORT = { w: 1920, h: 1080 };

export function usePortfolioViewport() {
  const [vp, setVp] = useState(DEFAULT_VIEWPORT);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return vp;
}
