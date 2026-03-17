import { IcoGH, IcoLI } from "../icons";
import { PROFILE_LINKS, SITE_EMAIL, SITE_URL } from "@/lib/site-config";

function FooterLink({ href, children, ariaLabel }) {
  return (
    <a
      className="pf-footer-link"
      href={href}
      aria-label={ariaLabel}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer noopener" : undefined}>
      {children}
    </a>
  );
}

export function FooterSection({ isDark, C }) {
  const links = [
    { label: "LinkedIn", href: PROFILE_LINKS.linkedin, icon: <IcoLI c={isDark ? "#f5f5f7" : "#1d1d1f"} /> },
    { label: "GitHub", href: PROFILE_LINKS.github, icon: <IcoGH c={isDark ? "#f5f5f7" : "#1d1d1f"} /> },
    { label: "Email", href: `mailto:${SITE_EMAIL}` },
  ];

  if (PROFILE_LINKS.medium) links.push({ label: "Medium", href: PROFILE_LINKS.medium });
  if (PROFILE_LINKS.orcid) links.push({ label: "ORCID", href: PROFILE_LINKS.orcid });

  return (
    <footer
      className="pf-footer"
      style={{
        background: isDark ? "#09090d" : "#f5f5f7",
        borderTop: `1px solid ${isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)"}`,
      }}>
      <div
        className="pf-footer-inner"
        style={{
          color: C.text,
        }}>
        <div className="pf-footer-brand">
          <p className="pf-footer-kicker" style={{ color: C.teal }}>
            Identidad
          </p>
          <h3 className={`pf-footer-title ${isDark ? "acc-dk" : "acc-lt"}`}>Manuel García-Llera Añón</h3>
          <p className="pf-footer-copy" style={{ color: C.textSec }}>
            Visual Design · UX/UI · Product Design · Research · 3D · Full Stack
          </p>
        </div>

        <div className="pf-footer-links">
          {links.map((item) => (
            <FooterLink key={item.label} href={item.href} ariaLabel={item.label}>
              {item.icon ? <span className="pf-footer-icon">{item.icon}</span> : null}
              {item.label}
            </FooterLink>
          ))}
        </div>

        <div className="pf-footer-meta" style={{ color: C.textSec }}>
          <p>{"Portfolio profesional optimizado para accesibilidad, rendimiento y experiencias 3D."}</p>
          <p>
            <a className="pf-footer-domain" href={SITE_URL} target="_blank" rel="noreferrer noopener">
              {SITE_URL.replace(/^https?:\/\//, "")}
            </a>
          </p>
          <p>{"© Manuel García-Llera Añón"}</p>
        </div>
      </div>
    </footer>
  );
}
