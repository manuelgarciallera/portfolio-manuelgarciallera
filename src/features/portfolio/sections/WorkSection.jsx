import { SmartImage as Img } from "../SmartImage";

const SERIF = "var(--font-playfair), Georgia, 'Times New Roman', serif";

export function WorkSection({ C, projects }) {
  return (
    <section
      style={{
        padding: "var(--sec-pad-y-lg,150px) var(--page-pad-x,28px)",
        background: C.bg,
        transition: "background .5s",
      }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <p
          className="rv"
          style={{
            fontSize: 12,
            color: C.textSec,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 18,
          }}>
          Trabajo seleccionado
        </p>
        <h2
          className="rv"
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(30px,4.4vw,52px)",
            fontWeight: 600,
            letterSpacing: "-.015em",
            lineHeight: 1.08,
            color: C.text,
            maxWidth: 760,
            marginBottom: 18,
          }}>
          Cuatro formas de entender un mismo oficio.
        </h2>
        <p
          className="rv"
          style={{
            transitionDelay: ".08s",
            fontSize: 17,
            lineHeight: 1.6,
            color: C.textSec,
            maxWidth: 580,
            marginBottom: 76,
          }}>
          De un marketplace full-stack a la visualizaci&oacute;n arquitect&oacute;nica: producto, c&oacute;digo e imagen tratados con el mismo criterio.
        </p>

        <div>
          {projects.map((p, i) => {
            const flip = i % 2 === 1;
            return (
              <article
                key={p.id}
                className="rv work-row"
                style={{
                  transitionDelay: `${0.06 * i}s`,
                  display: "grid",
                  gap: "clamp(24px,4vw,56px)",
                  alignItems: "center",
                  padding: "clamp(40px,5vw,64px) 0",
                  borderTop: `1px solid ${C.divider}`,
                }}>
                <div
                  className="work-media"
                  style={{
                    order: flip ? 2 : 1,
                    aspectRatio: "16 / 11",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: C.bgSec,
                  }}>
                  <Img src={p.src} fb={p.fb} alt={p.title} sizes="(max-width: 860px) 100vw, 520px" />
                </div>

                <div className="work-body" style={{ order: flip ? 1 : 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: C.teal,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}>
                      {p.cat}
                    </span>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.textSec, opacity: 0.5 }} />
                    <span style={{ fontSize: 12, color: C.textSec, fontWeight: 500 }}>{p.year}</span>
                  </div>

                  <h3
                    style={{
                      fontFamily: SERIF,
                      fontSize: "clamp(27px,3.4vw,40px)",
                      fontWeight: 600,
                      letterSpacing: "-.01em",
                      lineHeight: 1.06,
                      color: C.text,
                      marginBottom: 14,
                    }}>
                    {p.title}
                  </h3>

                  <p style={{ fontSize: 16, lineHeight: 1.62, color: C.textSec, maxWidth: 440, marginBottom: 22 }}>
                    {p.sub}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 12,
                          padding: "5px 12px",
                          borderRadius: 980,
                          border: `1px solid ${C.divider}`,
                          color: C.textSec,
                          fontWeight: 500,
                        }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
