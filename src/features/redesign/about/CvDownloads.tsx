import styles from './CvDownloads.module.css'

/** Native disclosure and links: usable without hydration or a PDF viewer bundle. */
export function CvDownloads() {
  return (
    <div className={styles.root}>
      <details className={styles.chooser}>
        <summary className={styles.trigger}>Descargar CV</summary>
        <ul className={styles.options} aria-label="Idioma del currículum">
          <li>
            <a href="/cv/manuel-garcia-llera-cv-es-2026-09-07.pdf"
              download="Manuel-Garcia-Llera-CV-ES-2026-09-07.pdf"
              hrefLang="es" type="application/pdf">
              <span>Español</span><span className={styles.format}>PDF · 1,9 MB</span>
            </a>
          </li>
          <li>
            <a href="/cv/manuel-garcia-llera-cv-en-2026-09-07.pdf"
              download="Manuel-Garcia-Llera-CV-EN-2026-09-07.pdf"
              hrefLang="en" lang="en" type="application/pdf">
              <span>English</span><span className={styles.format}>PDF · 1.9 MB</span>
            </a>
          </li>
        </ul>
      </details>
      <p className={styles.date}>Actualizado el <time dateTime="2026-09-07">7 de septiembre de 2026</time></p>
    </div>
  )
}
