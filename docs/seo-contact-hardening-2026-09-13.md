# Cierre parcial SEO y defensa de entrada del formulario

Manuel prioriza cerrar publicación/SEO/indexación/protección antes de ampliar
contenido comercial. No se declara ese cierre global conseguido.

## Cambios

Sitemap: conserva URLs publicadas y elimina lastModified no acreditado. La
fecha global 02-09 no representa cambios posteriores; publishedAt tampoco
demuestra la última modificación de artículos. No se sustituye por fecha de
build. Pendiente incorporar fechas editoriales reales por página cuando exista
su fuente autoritativa. Campo opcional según Google; no bloquea el sitemap.

Formulario: Content-Length no limita los bytes si el cliente lo omite.
Nuevo lector incremental con presupuesto 40.000 bytes y corte antes de JSON.parse.
El presupuesto admite 5.000 caracteres incluso con escape JSON y evita el
rechazo anterior de mensajes multibyte válidos por el umbral de 12.000 bytes.
Mantiene límites de campos, honeypot y transporte existentes. UTF-8 inválido,
JSON roto o cuerpo ausente producen 400; exceso 413. Al rechazar cancela la
lectura y libera el lector. No introduce dependencias ni envía correos de prueba.

TDD: lector inicial equivalente al parseo sin límite falla por no cortar el
stream y por devolver 400 en lugar de 413 (21d9d9). Versión acotada supera los
casos sin cabecera, chunks acumulados, Unicode, ausencia/JSON roto y frontera
exacta de 40.000 bytes con carácter multibyte dividido entre chunks.

## Pendientes que esta corrección NO resuelve

- El limitador de frecuencia sigue siendo local a cada instancia. Elegir y
  verificar una regla compartida del proveedor o almacenamiento atómico antes
  de afirmar limitación global. Sin provisionar ni contratar recursos aquí.
- No protege por sí solo de clientes lentos o DDoS; los límites de tiempo y
  defensa perimetral requieren revisión del despliegue.
- CSP permisiva todavía pendiente de endurecimiento ensayado; no se cambia el hero.
- Search Console requiere login IONOS del usuario, aún sin TXT verificado.
- Publicación, revisión visual desktop/móvil y confirmación de entrega del
  correo siguen pendientes. No se abren afirmaciones nuevas sobre doctorado.

Fuente: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

Verificación final: check:all salida0 (5f94a2), 238 unitarias/39 archivos,
14 guardas, lint/tipos/build29páginas, presupuesto10rutas y audit0. NODE_OPTIONS
ajustado temporalmente únicamente para retirar --use-system-ca incompatible con
workers, restaurado al salir; TLS no desactivado. No verificación visual nueva.
