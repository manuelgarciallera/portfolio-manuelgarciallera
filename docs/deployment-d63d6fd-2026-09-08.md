# Publicación autorizada — d63d6fd — 2026-09-08

SHA exacto: `d63d6fd2868cd0a8a62fc91aab300bf12bd761f5`.
Rama: `codex/checkpoint-pre-editor-2026-09-04`.
Checkpoint conservado: `0f0adf686b2752e23c25d224f8c60815b10fd451`.

## Autoridad y relevo

Manuel autorizó push y producción con ambas puertas previas. Claude entregó el
carril público cerrado en `d63d6fd` mediante Hub `e3130736`; Codex contrastó HEAD
y ausencia de cambios públicos, respondió `088163f3` y registró ACK `8b6b8c41`.
No se modifican contraseñas, DNS, permisos ni visibilidad del repositorio.

## Verificación reproducible

- `npm run check:all`: sesión `68156`, exit 0, final `17da1c`.
  Incluye 209 pruebas unitarias, 13 guardas, frontera de 21 entradas, perfiles
  tipográficos 8, navegación móvil estructural, lint, tipos, build 28 páginas,
  presupuesto de 10 rutas sin relajar tolerancias y auditoría pública 0 vulnerabilidades.
- `node node_modules/vitest/vitest.mjs run --config vitest.unit.config.ts`:
  `a39767`, exit 0; 209/209, 32 archivos, 6,71 s.
- HEAD/fuentes públicas/checkpoint comprobados inmediatamente antes del push.
- Push acotado al SHA exacto: `579ba7`, exit 0. `ls-remote` confirma el mismo SHA.

La modificación documental de QA en curso no forma parte del SHA publicado ni
del grafo de compilación pública. No se incluyeron archivos privados sin seguimiento.

## Despliegue

- Preview automático: `dpl_ex7q8mZqTC2UgSo69REDfzsXEH2E`, Ready, 36 s, SHA correcto.
- Promoción solicitada en la UI autenticada para `manuelgarciallera.com` y
  `portfolio-manuelgarciallera.vercel.app`; Vercel reconstruye con entorno Production.
- Producción: `dpl_DmyZqKghiWSekyL5Zrii247CZAwx`.
- Estado final observado: **Ready · Production**, 36 s, SHA `d63d6fd` y
  dominio `manuelgarciallera.com` asignado.
- URL de control: https://vercel.com/manuels-projects-25322539/portfolio-manuelgarciallera/DmyZqKghiWSekyL5Zrii247CZAwx
- Verificación HTTP externa `ab567e`, exit 0: `/`, `/investigacion`, `/sobre-mi`
  responden 200, canonical del dominio propio, Scholar presente y CSP con `blob:`.
  `https://www.manuelgarciallera.com/` responde 308 al dominio sin www.
- El primer intento HTTP (`c3c7b4`) encontró una CA no reconocida por el almacén
  propio de Node. Se repitió con `--use-system-ca`, conservando verificación TLS;
  no se deshabilitó la validación de certificados.
- No equivale a un barrido visual móvil ni a revisión completa de logs de runtime.

## Alcance y pendientes separados

No hay cambio visual nuevo ni activación del almacenamiento real del CMS. El
incremento de migración es QA sintética con revisión independiente; el owner
comercial, persistencia y corte real siguen siendo trabajo separado.

Claude confirmó autoría de los dos redeploys SMTP anteriores (3PVH9Ar2D y
98zrs2RDy) del antiguo c6746f6. Su informe de HTTP 200/SMTP no acredita por sí solo
que todos los destinatarios fueran aceptados o que los mensajes llegaran a las
bandejas; Codex no ha repetido envíos ni inspeccionado correo.

Hallazgos fuera de esta publicación: revisar política quality 92 frente a
images.qualities, portabilidad de la ruta estática de Storybook y entrega final
del correo con Manuel/Claude. No se modificaron para ampliar este despliegue.
