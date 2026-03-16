import { useEffect } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useLenisScroller({ wrapRef, enabled = false }) {
  useEffect(() => {
    if (!enabled) return undefined;

    const wrapper = wrapRef.current;
    if (!wrapper) return undefined;

    const content = wrapper.querySelector("main") || wrapper.firstElementChild || wrapper;

    const lenis = new Lenis({
      wrapper,
      content,
      autoRaf: false,
      smoothWheel: true,
      gestureOrientation: "vertical",
      wheelMultiplier: 0.95,
      touchMultiplier: 1.05,
      duration: 1.0,
      lerp: 0.09,
      syncTouch: false,
    });

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    let rafId = 0;
    const raf = (time) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);
    ScrollTrigger.refresh();

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.off("scroll", onScroll);
      lenis.destroy();
    };
  }, [enabled, wrapRef]);
}
