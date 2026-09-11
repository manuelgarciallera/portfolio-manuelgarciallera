# Preparación autónoma de las pruebas del CMS

Base8bf1890. Objetivo: una instalación de dependencias del paquete owner debe
poder iniciar sus propias pruebas de navegador, sin node_modules del portfolio
ni preparación manual heredada de otras pruebas.

## Fallos reproducidos

1. RED8a7b61: sin node_modules padre, importar browser-login.mjs produce
   ERR_MODULE_NOT_FOUND para playwright. La dependencia no estaba declarada
   en owner-platform aunque sus pruebas la usan.
2. Se añade playwright1.62.0 exacto como devDependency, misma versión utilizada
   en los ensayos anteriores. Lock añade únicamente playwright/core y fsevents
   opcional. No cambia ninguna dependencia productiva ni el paquete público.
3. npmci limpio en Docker pasa (`a3fd59`),735 paquetes. Resolución confirmada
   desde /work/owner-platform/node_modules/playwright/index.mjs (`8e7ee6`).
4. Segundo RED8e7ee6: el comando estricto no encuentra node_modules/.cache al
   crear la raíz TLS. El runner debe preparar su caché antes de los preflights,
   sin quitar su validación ni depender de una ejecución previa.

## Restricciones

Chromium y bibliotecas del SO siguen siendo requisitos de QA: en el ensayo
los proporciona la imagen Playwright1.62.0 documentada en docker-editor-verification.
No se descargan navegadores en la web pública ni se incorpora Playwright al
runtime. Una instalación --omit=dev no está destinada a ejecutar estas pruebas.

Contenedor sin montajes ni puertos; red conectada solo durante npmci y después
desconectada. Las dependencias padre se apartan dentro del contenedor sin
eliminarlas; ninguna dependencia host se mueve. Sin credenciales, datos reales,
despliegue, cambios visuales o cambios de confianza/antivirus.

## Verificación final

- El runner prepara la caché solo si se solicitan los modos TLS; conserva los
  controles de cierre y limpieza de cada raíz propia. Revisión independiente
  de manifiesto/lock y runner sin bloqueadores.
- Ensayo combinado desde instalación limpia y sin node_modules padre pasa:
  creación/edición/ordenación/guardado/preview390/1280, imágenes privadas y
  conservación tras reinicioNext (`a6806b`).
- Salida terminal0, app/clúster cerrados y raíz limpiada (`35b026`). Inspección
  de procesos sin hijos de pruebas y contenedor detenido (`d6f76a`).
- Sintaxis Node correcta; lint y frontera pública21 pasan (`3d2b91`). Las
  unitarias1251 y la integración71 del incremento anterior no se presentan
  como ejecutadas de nuevo aquí; no hay cambio productivo.
