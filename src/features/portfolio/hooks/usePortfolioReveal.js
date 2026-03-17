import { useEffect, useRef } from "react";

export function usePortfolioReveal(wrapRef, reducedMotionRef) {
  const scrollDirRef = useRef("down");
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onScroll = () => {
      const top = el.scrollTop;
      if (top !== lastScrollTopRef.current) {
        scrollDirRef.current = top > lastScrollTopRef.current ? "down" : "up";
        lastScrollTopRef.current = top;
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [wrapRef]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (reducedMotionRef?.current) {
      el
        .querySelectorAll(".rv,.rv2,.rs,.rl,.rr,.clip-rv,.ttl-rv")
        .forEach((node) => node.classList.add("in"));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in");
      }),
      { threshold: 0.04, rootMargin: "0px 0px -40px 0px", root: el }
    );

    const timer = window.setTimeout(() => {
      el
        .querySelectorAll(".rv,.rv2,.rs,.rl,.rr,.clip-rv")
        .forEach((node) => {
          // Titles are managed by their dedicated observer to avoid class toggle fights.
          if (node.classList.contains("ttl-rv")) return;
          revealObserver.observe(node);
        });
    }, 120);

    return () => {
      window.clearTimeout(timer);
      revealObserver.disconnect();
    };
  }, [reducedMotionRef, wrapRef]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (reducedMotionRef?.current) return;

    const ENTER_RATIO = 0.3;
    const EXIT_RATIO = 0.1;
    const visibleState = new WeakMap();
    const titleNodes = el.querySelectorAll(".ttl-rv");
    titleNodes.forEach((node) => {
      node.setAttribute("data-reveal-dir", "down");
      visibleState.set(node, node.classList.contains("in"));
    });

    const titleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const node = entry.target;
          const ratio = entry.intersectionRatio ?? 0;
          const currentlyVisible = visibleState.get(node) ?? false;

          if (!currentlyVisible && ratio >= ENTER_RATIO) {
            node.classList.add("in");
            visibleState.set(node, true);
            return;
          }

          if (currentlyVisible && ratio <= EXIT_RATIO) {
            node.classList.remove("in");
            node.setAttribute("data-reveal-dir", scrollDirRef.current);
            visibleState.set(node, false);
          }
        });
      },
      {
        threshold: [0, EXIT_RATIO, 0.2, ENTER_RATIO, 0.5, 1],
        rootMargin: "-64px 0px -6% 0px",
        root: el,
      }
    );

    titleNodes.forEach((node) => titleObserver.observe(node));
    return () => titleObserver.disconnect();
  }, [reducedMotionRef, wrapRef]);
}
