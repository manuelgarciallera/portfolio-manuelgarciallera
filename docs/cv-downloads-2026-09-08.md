# CV público bilingüe · 2026-09-08

Manuel autoriza revisar los dos PDF de Descargas del 7 de septiembre y ofrecer
descarga en español e inglés. Decisión: selector nativo discreto en Perfil de
`/sobre-mi`, junto a los identificadores profesionales. No se añade a la navbar
ni se modifica el hero. Base local `30ef3d8`; producción de partida `b1512cc`.

## Documentos

Originales de una página A4 revisados mediante extracción y renderizado; no se
reexportaron, comprimieron ni reescribieron. Incluyen fotografía y los datos de
contacto profesional elegidos por Manuel (también teléfono). Los originales en
Descargas permanecen intactos. No se han copiado otros CV de esa carpeta.

| Idioma | Archivo público | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Español | `public/cv/manuel-garcia-llera-cv-es-2026-09-07.pdf` | 1879895 | `62fb12c81cacfe7720b40b166a506c535052d1d671d9a49f6967262152f5fdd3` |
| Inglés | `public/cv/manuel-garcia-llera-cv-en-2026-09-07.pdf` | 1892940 | `a98db5e606d67582b3f7b87d26e7cf97b7a1c61dc8d8f4d0c92cc7f32f085e97` |

Observaciones editoriales pendientes, no cambios de contenido: Full Stack figura
9,86 en los PDF frente a 9,5 en la web; UX/UI 9,59 frente a 9,6 (redondeo). El PDF
inglés contiene «LENGUAGES». No se certifican equivalencias/títulos ni se alteran
sin revisión del propietario. La extracción tiene espaciado irregular propio de
la exportación de Figma; se mantiene también la revisión visual, no se promete
compatibilidad ATS ni etiquetado accesible completo del PDF.

## Implementación y alcance

- `CvDownloads.tsx` de servidor, `details/summary` y enlaces `download`, idioma,
  tipo PDF, fecha y peso aproximado. Sin JS ni dependencias adicionales.
- CSS module con tokens existentes, objetivos táctiles de al menos 44 px, foco
  visible, enlaces que se ajustan al ancho. Sin menús superpuestos ni animación.
- `AboutIdentity.tsx`: import e inserción. Se retira `rd-reveal` del contenedor
  estático del perfil para no ocultar el CV sin JS; no cambia su composición.
- Archivos estáticos fechados: no se solicita ningún PDF hasta elegirlo. Actualizar
  el CV todavía requiere sustituir/versionar archivo y referencia en código. No
  se afirma integración con la biblioteca del CMS, cuyo soporte documental tiene
  puertas operativas pendientes.

## Pruebas y revisión

Dos pruebas focales RED funcionales con scaffold vacío, luego GREEN. Cubren marcado
y que cada descarga apunta a los bytes revisados en su idioma. Revisión independiente
detectó el antecesor oculto `.rd-reveal`: el primer barrido pasó sus 16 descargas en
8 perfiles pero falló al hacer click sin JS. Sonda focal obtuvo opacidad 0,533 en
transición, incompatible con la expectativa 1; no se considera éxito. Corregidos
el contenedor y la aserción de opacidad de todos los antecesores.

`npm run check:all` final: salida 0, 219 unitarias, 13 guardas, frontera 21,
encoding/hero/responsive, lint, tipos, build 29 páginas, presupuesto 10 rutas y
auditoría pública sin vulnerabilidades. Sin modificar baseline. Comparación
`/sobre-mi` contra el presupuesto existente: +130 B JS raw / +41 B gzip; el
selector es marcado de servidor, esta comparación incluye los chunks compartidos.
Los PDF (~3,8 MB conjuntos) no forman parte de la carga inicial.

Verificador reproducible: `node scripts/check-cv-downloads.mjs` con servidor local
en 3014 (o `CV_TEST_URL` localhost explícita). Descarga ambos idiomas, compara hashes,
verifica teclado, 320/390/768/1440 y ambos temas, ausencia de precarga/overflow y
acceso sin JavaScript. Capturas privadas bajo `tmp/cv-verification`.

## Coordinación y continuidad

Reserva a Claude `236f1c66-1037-45d2-9d4d-773b9ed60b8a`, enviada sin acuse inferido.
No solapamiento de fuentes públicas observado; no navbar/orbe/correo/DNS ni datos
reales del CMS modificados. Tres documentos compartidos dirty preservados fuera
del commit. Continuación CMS sigue en `docs/owner-platform/cms-audit-handoff-2026-09-08.md`.
Navegador final: 8/8 perfiles, 16 descargas correctas y sin errores JS; comprobación
sin JavaScript correcta, salida 0. Unitarias independientes repetidas 219/219,
36 archivos, salida 0; aviso de tiempo de plugin (sin asertos fallidos).
Publicación se registra después de verificarla.
