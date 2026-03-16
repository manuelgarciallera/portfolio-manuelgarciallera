import { useEffect, useRef } from "react";

export function usePortfolioReveal(wrapRef) {
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

    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in");
      }),
      { threshold: 0.04, rootMargin: "0px 0px -40px 0px", root: el }
    );

    const timer = window.setTimeout(() => {
      el
        .querySelectorAll(".rv,.rv2,.rs,.rl,.rr,.clip-rv")
        .forEach((node) => revealObserver.observe(node));
    }, 120);

    return () => {
      window.clearTimeout(timer);
      revealObserver.disconnect();
    };
  }, [wrapRef]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const titleNodes = el.querySelectorAll(".ttl-rv");
    titleNodes.forEach((node) => node.setAttribute("data-reveal-dir", "down"));

    const titleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
          } else {
            entry.target.classList.remove("in");
            entry.target.setAttribute("data-reveal-dir", scrollDirRef.current);
          }
        });
      },
      { threshold: 0.2, rootMargin: "-6% 0px -6% 0px", root: el }
    );

    titleNodes.forEach((node) => titleObserver.observe(node));
    return () => titleObserver.disconnect();
  }, [wrapRef]);
}
