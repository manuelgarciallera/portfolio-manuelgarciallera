export function HeroSection({ heroSectionRef, isDark, onNavSelect }) {
  return (
    <section
      ref={heroSectionRef}
      className={`pf-hero-orb ${isDark ? "pf-hero-orb-dark" : "pf-hero-orb-light"}`}
      style={{
        "--hero-bg": "#fbfbf8",
        "--hero-text": "#202020",
        "--hero-muted": "#717171",
      }}>
      <h1 className="pf-hero-seo">Manuel Garc&iacute;a-Llera, AI Design Engineer</h1>

      <div className="pf-hero-water-stage" aria-hidden="true">
        <div className="hero-orb-fallback">
          <span>Manuel Garc&iacute;a-Llera</span>
        </div>
        <div className="pf-hero-title-lock">
          <p className="pf-hero-display-name">Manuel Garc&iacute;a-Llera</p>
          <p className="pf-hero-fields">UX/UI &middot; HCI &middot; Figma prototyping &middot; Frontend development &middot; Human-AI interaction</p>
        </div>
        <div className="pf-hero-liquid-proxy" />
      </div>

      <p className="pf-hero-role">AI Design Engineer</p>

      <div className="pf-hero-aside">
        <p>I design, prototype and build human-centered AI interfaces.</p>
        <button type="button" onClick={() => onNavSelect && onNavSelect("Sobre m\u00ed")}>
          More about me <span aria-hidden="true">-&gt;</span>
        </button>
      </div>
    </section>
  );
}
