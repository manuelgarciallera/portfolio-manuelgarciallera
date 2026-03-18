import { HeroBackgroundCanvas } from "../three/HeroBackgroundCanvas";

export function HeroSection({ wrapRef, heroSectionRef, prefRM }) {
  return (
    <section
      ref={heroSectionRef}
      style={{
        height: "var(--hero-full-h,100dvh)",
        minHeight: "var(--hero-min-h,620px)",
        position: "relative",
        marginTop: -52,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
      }}>
      <HeroBackgroundCanvas wrapRef={wrapRef} heroSectionRef={heroSectionRef} prefRM={prefRM} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 65% 55% at 50% 40%,rgba(94,196,200,.034) 0%,transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          padding: "0 var(--hero-side-pad,24px)",
          maxWidth: 980,
          width: "100%",
        }}>
        <p
          style={{
            fontSize: 13.5,
            color: "rgba(255,255,255,.62)",
            letterSpacing: ".015em",
            marginBottom: 20,
            fontWeight: 400,
          }}>
          {"Portfolio \u00b7 Manuel Garc\u00eda-Llera A\u00f1\u00f3n"}
        </p>
        <h1
          className="acc-dk"
          style={{
            fontSize: "clamp(50px,8.5vw,98px)",
            fontWeight: 700,
            lineHeight: 1.03,
            letterSpacing: "-.048em",
            marginBottom: 6,
          }}>
          <span style={{ display: "block" }}>{"Dise\u00f1o que"}</span>
          <span style={{ display: "block" }}>
            {"piensa en "}
            <span className="acc-dk">{"c\u00f3digo."}</span>
          </span>
        </h1>
        <p
          style={{
            fontSize: "clamp(17px,1.9vw,20px)",
            color: "rgba(255,255,255,.7)",
            lineHeight: 1.58,
            maxWidth: 500,
            margin: "28px auto 44px",
            fontWeight: 400,
            letterSpacing: "-.015em",
          }}>
          {"Visual Design Manager en LALIGA."}
          <br />
          {"UX, producto, 3D arquitect\u00f3nico y full stack."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-blue">{"Ver proyectos"}</button>
          <button className="btn-ghost-dk">{"M\u00e1s sobre m\u00ed"}</button>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
        <div
          style={{
            width: 20,
            height: 32,
            borderRadius: 10,
            border: "1.5px solid rgba(255,255,255,.18)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 4,
          }}>
          <div
            style={{
              width: 3,
              height: 7,
              borderRadius: 2,
              background: "rgba(255,255,255,.3)",
              animation: "pscroll 2.2s infinite ease-in-out",
            }}
          />
        </div>
      </div>
    </section>
  );
}
