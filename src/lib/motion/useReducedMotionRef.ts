import { useEffect, useRef } from "react";

export function useReducedMotionRef() {
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      reducedMotionRef.current = media.matches;
      document.documentElement.toggleAttribute("data-reduced-motion", media.matches);
    };

    syncPreference();

    if (media.addEventListener) {
      media.addEventListener("change", syncPreference);
      return () => media.removeEventListener("change", syncPreference);
    }

    media.addListener(syncPreference);
    return () => media.removeListener(syncPreference);
  }, []);

  return reducedMotionRef;
}
