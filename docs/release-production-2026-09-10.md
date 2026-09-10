# Portfolio publicado · 10 de septiembre de 2026

## Resultado y alcance

- SHA publicado: `b5463b93d58b32ea410e7504a4e5ad003a8757b2`.
- Vercel Production READY: `dpl_EZHxJ77q3hRxYqQFYxgE7pff48Rx`, build de 41 s, dominio `https://manuelgarciallera.com`.
- Promoción desde Preview `dpl_5yqu3zERuLbh7hK37ivftSdgxyQq`, reconstruida por Vercel con entorno Production. No se editaron variables, DNS ni correo.
- Push confirmado contra origin. Codex fue el único escritor y operador del despliegue, bajo autorización previa y reiterada de Manuel.
- Rollback disponible: producción anterior `dpl_HhQaU6HEzL8qqQg8SS5m7zNZoNqM`, SHA `090cf6312b6e4451c4115d7fa260b55a1e151dba`. Checkpoint pre-editor intacto: `0f0adf686b2752e23c25d224f8c60815b10fd451`.

## Rectificación del bloqueo

La alerta de Payload pertenece a owner-platform, una aplicación no desplegada por este proyecto Vercel. Bloquear la publicación del portfolio por esa alerta confundía ambos alcances. No se cambió CI, no se añadió ninguna excepción y no se declaró segura la dependencia afectada.

Evidencia: guardas públicas sobre 21 entradas correctas; 24 archivos NFT del build inspeccionados mediante sus listas JSON, sin owner-platform ni Payload; rutas del artefacto Vercel públicas; `/admin` y `/api/users` devuelven 404 en el dominio. El CMS permanece bloqueado para producción. GHSA-jg8r-5jh2-v2xj continúa abierto, npm informa ocho entradas moderadas derivadas del mismo aviso, sin versión posterior a Payload 3.88.0 disponible en esta comprobación.

GitHub Actions `34439195865`: validate público SUCCESS; owner FAILURE exclusivamente en Security audit (owner runtime deps). No afirmar CI global verde. Los tests, integración, lint, tipos y build del job owner no son el paso fallido.

## Verificación fresca

- Primer check:all (7530) falló durante build: ERR_WORKER_INVALID_EXEC_ARGV por `--use-system-ca` heredado en NODE_OPTIONS. No se publicó tras ese resultado.
- Repetición completa (21304) retirando únicamente esa opción del entorno del comando: salida 0. Sin cambiar la configuración persistente ni desactivar verificación TLS. La prueba mínima Worker aislada no reprodujo el fallo; el build completo sí pasó con ese cambio de entorno.
- 224/224 unitarias, 14/14 guardas, lint, tipos, codificación, responsive, build de 29 páginas, presupuesto de 10 rutas y auditoría runtime pública (cero vulnerabilidades).
- Vitest independiente solicitado por Manuel (42079): 224/224, salida 0.
- Browser local sobre build de producción (37560): 390, 768 y 1440 px; un canvas, fallback oculto tras carga, cero overflow, cero errores JS y sin solapamiento entre columnas desktop.
- Mismo script contra el dominio público (24945): las tres resoluciones pasan, salida 0. Captura 390 inspeccionada: se lee Manuel / García-Llera / Añón. Son navegadores emulados, no el teléfono de Manuel.
- HTTP 200: `/`, `/investigacion`, `/sobre-mi`, `/proceso`, `/casos/nude-project`, `/favicon.ico`. No se envió correo de prueba; estos checks no acreditan entrega SMTP.

## Pendientes explícitos

El nombre completo y la retirada del respaldo al terminar de cargar están publicados. El acabado oscuro/pequeño del orbe y la diferencia entre la imagen blanca inicial y el canvas NO están resueltos; tampoco se ha igualado la fuente WebGL a la pila de títulos. No anunciar cierre visual completo. El candidato estático previo sigue retirado y no se ha eliminado la interacción WebGL.

Siguiente responsable: Codex, corrección visual acotada del hero y cierre de seguridad/operación del CMS. Claude puede revisar cuestiones concretas sin editar Git. Hub: propuesta 9282c5ca; fallo de entorno e2dd40fb; decisión de publicación pública e69ad96b. No inferir aceptación independiente de un mensaje enviado.
