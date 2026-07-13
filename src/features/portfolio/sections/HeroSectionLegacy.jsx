export function HeroSectionLegacy({ heroSectionRef, isDark, colors, onNavSelect }) {
  const ghostBorder = isDark ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.16)";

  return (
    <section
      ref={heroSectionRef}
      style={{
        minHeight: "78vh",
        display: "flex",
        alignItems: "center",
        background: colors.bg,
        transition: "background .5s",
        padding: "72px var(--page-pad-x,28px)",
      }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%" }}>
        <p
          style={{
            fontSize: "clamp(22px,2.7vw,34px)",
            fontWeight: 600,
            letterSpacing: "-.015em",
            color: colors.text,
            margin: "0 0 22px",
          }}>
          Manuel Garc&iacute;a-Llera A&ntilde;&oacute;n
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-playfair), Georgia, "Times New Roman", serif',
            fontSize: "clamp(40px,6.2vw,86px)",
            lineHeight: 1.05,
            letterSpacing: "-.01em",
            fontWeight: 600,
            color: colors.text,
            maxWidth: 1000,
            margin: 0,
          }}>
          Dise&ntilde;o productos digitales, los construyo con c&oacute;digo y estudio c&oacute;mo mejorarlos.
        </h1>

        <p
          style={{
            fontSize: "clamp(16px,1.7vw,19px)",
            lineHeight: 1.6,
            color: colors.textSec,
            maxWidth: 580,
            margin: "30px 0 0",
            fontWeight: 400,
          }}>
          UX, producto, visualizaci&oacute;n 3D y desarrollo full-stack.
        </p>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: colors.textSec,
            margin: "9px 0 0",
            fontWeight: 400,
            opacity: 0.82,
          }}>
          IA &middot; Dise&ntilde;o &middot; Prototipado &middot; Desarrollo
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 42 }}>
          <button
            type="button"
            onClick={() => onNavSelect && onNavSelect("Trabajo")}
            style={{
              fontSize: 14.5,
              fontWeight: 500,
              padding: "13px 28px",
              borderRadius: 980,
              border: "none",
              cursor: "pointer",
              background: colors.text,
              color: colors.bg,
              transition: "opacity .2s",
            }}>
            Ver proyectos
          </button>
          <button
            type="button"
            onClick={() => onNavSelect && onNavSelect("Sobre m\u00ed")}
            style={{
              fontSize: 14.5,
              fontWeight: 500,
              padding: "13px 28px",
              borderRadius: 980,
              border: `1px solid ${ghostBorder}`,
              cursor: "pointer",
              background: "transparent",
              color: colors.text,
              transition: "border-color .2s",
            }}>
            Sobre m&iacute;
          </button>
        </div>
      </div>
    </section>
  );
}
