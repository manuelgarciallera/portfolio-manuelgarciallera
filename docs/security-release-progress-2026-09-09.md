# Cierre público: ventana autorizada de dos horas

Codex, 2026-09-09. Base `57148f0`. Único integrador; Claude revisión por Hub.

- Audit reproducido: salida 1, Next 16.2.11 crítico y Sharp 0.35.3 alto.
- Cambios propios: package.json y package-lock.json, Next/eslint-config-next 16.3.4 y Sharp 0.35.4 incluido override. Instalación completa; no dependencias directas nuevas. React y owner intactos.
- `npm audit --omit=dev`: salida 0, cero vulnerabilidades. Instalación informa cinco moderadas en árbol completo de desarrollo: no equivale a auditoría total limpia.
- Vitest independiente: 224/224, 37 archivos, salida 0. `git diff --check` salida 0.
- `check:all` sesión 81857 terminado con salida 0: unitarias, guardas, frontera, encoding, responsive, lint, tipos, build de 29 rutas, presupuesto público de 10 rutas y auditoría de producción superados. Lint conserva un warning por `_props`; baseline no ampliado.
- Hero local documentado en hero-single-visual-2026-09-09.md. Repetido con nuevo build: sesión 29971 salida 0, ocho combinaciones 320/390/768/1440 normal/reduced, una imagen, cero canvas hero, nombre completo y fuente iguales a h1, sin overflow. Servidor QA 18118 detenido tras ensayo.
- Auditoría completa caracteriza cinco moderadas como cadena Vitest/mocker 4.1.10, GHSA-82fw-gwwq-j7x9, parche indicado 4.1.11. Pendiente revisión/actualización separada de tooling; no afecta al resultado cero de producción ni se afirma seguridad absoluta.
- index.lock anterior, cero bytes, 18:24:36 UTC, conservado. Ausencia de procesos git visibles no acredita ausencia de escritor externo. Solicitud de confirmación a Claude: 7e45cddf-bf35-4a01-aea9-b3512e0b6c21.
- Sin nuevo commit, push ni despliegue. No presentar parche instalado como publicado.
- Automatización temporal existente reactivada por petición expresa nueva hasta 20:35 UTC, cada 30 minutos, sin prolongación automática. No duplica bandeja horaria.

Siguiente: terminar puertas y navegador, resolver lock de forma comprobada, commits acotados, publicación autorizada únicamente si todo pasa; comprobar SHA y dominio. Después CMS QA sin activar almacenamiento ni puente productivo.

Fuentes contrastadas: https://nextjs.org/docs/app/guides/upgrading/version-16 ; https://github.com/advisories/GHSA-2xp9-vwfh-vxw4 ; https://github.com/advisories/GHSA-rgj7-g3m4-5g8c .

## Relevo 19:10 UTC: candidato de seguridad separado

- Claude f0184c98 confirma propietario, hora y fin del escritor del index.lock. Contrastado cero bytes y fecha exacta, sin git activo. Movido únicamente ese archivo a `.git/index.lock.claude-confirmed-20260909-1910`; recuperable, no borrado.
- Objeción recibida a retirar refracción: no publicar candidato sin canvas. Cambios propios visuales conservados en `docs/hero-static-candidate-2026-09-09.patch`, pruebas y documento anteriores conservados. Los cuatro archivos Hero/CSS/tests vuelven mediante parche inverso a 57148f0; diff de esos cuatro archivos vacío. No se descartó trabajo ajeno.
- Nuevo candidato: exclusivamente dependencias sobre 57148f0. Check:all sesión48180 salida0, build29rutas, budget10rutas, auditprod0; Vitest independiente224/224 salida0 (0b4ac5). No trasladar estas pruebas al candidato estático rechazado.
- Verificación browser específica `scripts/check-release-hero.mjs`: exige canvas listo, fallback oculto, una escena y ausencia de overflow/solape desktop en390/768/1440. No demuestra igualdad material de fallback/lienzo ni corrección de todo el hero.
- Vercel MCP get_project devuelve404; navegador disponible pide login. No modificar cuentas ni suponer publicación. GitHub push autorizado sigue siendo distinto a producción.
