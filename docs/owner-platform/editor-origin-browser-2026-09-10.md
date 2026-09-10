# Revalidación del editor y origen de las peticiones de prueba

Fecha: 2026-09-10. Base Git: `38fcd89`. Instancias Next dev aisladas en
`127.0.0.1:3013`, bases SQLite nuevas y cuentas `@example.invalid`.

## Hallazgo

La primera sonda leyó el cuerpo en `domcontentloaded` y lo encontró vacío
(`fbc02c`). La segunda observó cuerpo inicial vacío y después formulario visible
en `/admin/create-first-user`, sin errores (`245593`). Se corrigió la espera
del ensayo, no el runtime: esperar al formulario, no asumir que recibir HTML
equivale a terminar el renderizado/redirect de Next.

El test de login falló después de respuesta 200 y redirección al panel:
`context.request.get('/api/users/me')` devolvía `user:null` (`ccd76b`).
La instrumentación acotada mostró cookie HttpOnly presente, respuesta de login
con usuario/token y consulta con JWT válida, pero consulta con cookie sin origen
rechazada (`966284`). No se registraron valores de cookies o tokens.

La implementación instalada de Payload en `dist/auth/extractJWT.js` explica el
resultado: con CSRF configurado, una cookie exige Origin permitido o cabeceras
Fetch Metadata válidas. El cliente API auxiliar de Playwright no las añade como
el navegador. `OWNER_SERVER_URL` debe estar configurado en esta prueba para
ejercitar esa frontera, no retirarse para que pasen los tests antiguos.

## Corrección del ensayo

- Login inválido y válido: consultar `/me` mediante `fetch` dentro de la página.
  Así se observa la sesión real del navegador y sus cabeceras naturales.
- Tras login válido se mantiene un negativo separado: cookie sin origen desde
  el cliente auxiliar no debe autenticar. No se debilita CSRF para resolverlo.
- Preparación/lectura auxiliar de páginas y recorridos de restauración: enviar
  Origin local explícito únicamente en llamadas API. No inyectarlo globalmente
  en las peticiones UI, para conservar la verificación de navegación real.
- Revisión independiente detectó que la antigua aserción tras login inválido
  era débil por la misma causa. Corregida usando también el navegador real.

## Alcance y resultados

Las ejecuciones usan primer registro obligatorio en base vacía, secretos
aleatorios solo en memoria y variables de proveedores neutralizadas. No utilizan
datos del owner habitual ni envían correos. Se detiene únicamente el árbol del
servidor creado por el ensayo; las bases sintéticas se conservan ignoradas por
Git. `agent-browser` no estaba disponible: se usó Playwright instalado.

Resultados finales:

- Login `446df2`: 390/1280 px, credencial incorrecta rechazada, sesión real
  nula tras rechazo y válida tras login, teclado, redirección y recarga.
- Editor `3cf171`, salida terminal 0: 390/1280 px, edición/reordenación,
  persistencia, preview privado, aislamiento publicado y restauración confirmada
  por UI. El servidor QA se cerró al finalizar. Base sintética final:
  `.data/qa-editor-final-11727bc5-8616-41bf-97a2-e9326f4b40c4.db`.
- Shell `2d1272`, salida 0: 320/390/768/1024/1280/1680 px, claro y oscuro,
  teclado, menú móvil, cuenta, editor y preview sin desbordamiento detectado.
- Captura `.audit/cms-editor-390-light.png` inspeccionada: controles dentro de
  pantalla; persiste mezcla de etiquetas ES/EN (Title, Brand Profile, Brand
  Overrides). Mejora de claridad pendiente, no corregida ni ocultada aquí.
- Revisión independiente final: P2 de negativo débil resuelto y cabeceras
  limitadas al cliente API; sin bloqueadores. No ejecutó pruebas.
- ESLint focal y diff `620f76`: salida 0. Frontera pública `c6f702`: 21 entradas.
  Cambio generado en `next-env.d.ts` retirado tras cerrar servidor; no se
  versiona una ruta de tipos de desarrollo por esta ejecución.

No se repiten build ni suite completa de runtime: los tres archivos modificados
son exclusivamente pruebas de navegador. La ejecución anterior global permanece
documentada por separado; no se presenta como una prueba nueva de este turno.

No hay cambios en autenticación productiva, permisos, dependencias ni diseño.
Estas pruebas cubren tareas y geometría concretas; no certifican todos los
recorridos del CMS, un dispositivo físico ni PostgreSQL remoto.

Codex integra. Reserva Hub: `ead35ca1-4e6c-43ad-b9c3-092e86aecc92`.
