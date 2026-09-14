# Comprobación HTTP de producción · 14/09/2026

Codex, 09:03–09:05 Europe/Madrid. Base local `6ee33de`.
Alcance: GET públicos y pruebas locales existentes, sin envío de formulario,
Search Console, cambios DNS, código público ni despliegue. No auditoría visual.

## Resultados frescos

- Sitemap: HTTP 200, 15 URLs, ninguna fecha lastmod no acreditada.
- Las 15 URLs responden 200; cada HTML tiene un H1, descripción, canonical
  correspondiente e `index, follow`, sin X-Robots-Tag restrictivo observado.
- Portada: «Manuel García-Llera Añón | UX/UI y sistemas de diseño».
- Descripción de portada: «Diseñador UX/UI y Design Engineer. Conecto sistemas
  de diseño, desarrollo e investigación sobre interacción humano-IA para crear
  productos digitales.» Ya está servida públicamente, no solo en Git.
- robots.txt permite el sitio, excluye /lab/ y señala el sitemap correcto.
- Favicon enlazado: /favicon.ico (también con query de versión), HTTP 200,
  5.641 bytes, idéntico byte a byte a src/app/favicon.ico. Cuatro tamaños:
  16, 32, 48 y 64 px. SHA256:
  `37de7dbf1e84e68e9052c308ceec4db5844c0728d64b52357177c0363a5e3d6c`.
  Esto verifica el archivo servido, no su actualización en Google o su legibilidad.
- /images/manuel-garcia-llera.jpg y /opengraph-image: HTTP 200, MIME JPEG/PNG,
  161.484 / 116.427 bytes. No se evaluó calidad visual ni decodificación.
- /icon.svg devuelve 404, pero NO está enlazado en el HTML: la ruta inventariada
  no constituye un favicon roto; no crear un recurso duplicado por este sondeo.
- HSTS, SAMEORIGIN y nosniff presentes. CSP mantiene unsafe-inline, unsafe-eval
  y fuentes HTTPS amplias; no se atribuye endurecimiento a esta comprobación.
- Validación del formulario y lector de cuerpo: 8/8 pruebas, 2 archivos,
  comando npm run test:unit -- src/lib/contact.unit.test.ts src/lib/contact-body.unit.test.ts.

## Hallazgos y siguientes responsables

1. Títulos interiores de casos, proceso, investigación, sobre mí y artículos
   siguen usando «Manuel García-Llera», sin Añón. La corrección de portada no
   implica corrección global. Codex: preparar ajuste acotado coordinado con el
   responsable público; no requiere inventar nuevas credenciales ni biografía.
2. Descripción del Coordination Hub promete «consenso verificable, sin una persona
   haciendo de mensajero». Revisar precisión frente al estado PILOT del protocolo;
   no cambiar a una nueva promesa ni considerar esta frase evidencia de validación.
3. Guía contact-form-deployment.md estaba obsoleta: se corrige contra mailer.ts,
   que prioriza SMTP y no reintenta por Resend cuando SMTP falla. Solo documentación.
4. Google: no se comprobó Search Console ni se solicitó rastreo. HTTP correcto
   no acredita indexación, snippet, posición ni favicon mostrado por Google.
5. Correo real y protección compartida antiabuso siguen sin cerrar en esta sesión.
6. CMS: no se modifica el criterio histórico de aislamiento ni las puertas de
   producción. Staging, medios reales, correo y copia externa requieren su propia evidencia.

## Git y trazabilidad

git ls-remote observó rama remota codex/checkpoint-pre-editor-2026-09-04 en
`11f75ebebc8bd0d899b045fb78201a962c4f6ccc` y main en
`c6fdf4b09dd584106be0a41414cbbd40bdff1e0c`. Son referencias Git, no prueba del
commit que Vercel sirve. No se hizo push ni se afirmó sincronización.
Checkpoint histórico verificado en `0f0adf686b2752e23c25d224f8c60815b10fd451`.
Se preservan los cinco documentos compartidos modificados previamente.
Reserva/alcance notificado al Hub: `38c645b9-81f0-4b14-ab52-ebe2b3e3abe1`.
Recibos de herramientas: HTTP `3462ea`, recursos `1f3603`, favicon/pruebas/Git `569a43`.
