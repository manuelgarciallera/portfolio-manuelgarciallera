# Prueba de dos orbes desde el móvil

## Estado actual: archivada por decisión de Manuel (17/09/2026)

Actualización posterior, al recuperar portadas grandes del blog: se elimina `src/app/lab/orbes/page.tsx` y su única entrada de presupuesto para impedir republicar el amarillo en el siguiente deploy. Los motores y el prototipo siguen guardados; la ruta completa se recupera desde `b9e3edd`. Verificación de build/blog exige `/lab/orbes` 404. Queda resuelto el gate preventivo indicado abajo.

Manuel descarta el segundo orbe en el Hero por saturación visual y ralentización percibida. Conservarlo para posibles usos futuros, sin reactivarlo ni publicarlo de nuevo por defecto. Producción restaurada mediante rollback explícito a `dpl_ETCh9v7FwddDvnnGSJ3Uiw1h2tnc`, runtime `b6fd0c1`, checkpoint remoto `checkpoint/approved-blue-orb-2026-09-17`. La portada mantiene solo el azul y `/lab/orbes` deja de estar publicado (404).

Verificación fresca: rollback CLI correcto (`b8334d`); Firefox emulado 390×844 contra el dominio original confirma canvas azul listo, ningún `.rd-dual-warm` y prueba retirada con HTTP 404 (`73db61`). No es medición de FPS en dispositivo físico.

Recuperación del experimento: commit `b9e3edd`, `src/features/redesign/lab/`, `src/app/lab/orbes/page.tsx` y `experiments/mobile-dual-orb/`. El código permanece en Git y en la rama de trabajo; **antes del siguiente despliegue desde esta rama hay que excluir o desactivar la ruta de laboratorio para no republicarla accidentalmente**. No ejecutar un despliegue global de HEAD como continuación de este rollback. Las pruebas `verify-dual-orb-lab.mjs` corresponden al experimento archivado, no al dominio restaurado.

El primer ente 3D, distinto de este experimento, sigue localizado en [hero-original-recovery.md](../hero-original-recovery.md): commit `5d61c80`, archivos `HeroBackgroundCanvas.jsx` y `heroShaders.js`. Prioridad futura: recuperarlo en una prueba visual aislada; no reemplazar el azul aprobado sin nueva revisión de Manuel.

Siguiente responsable: Codex conserva ambos antecedentes y respeta el bloqueo de republicación; Manuel decide si se reutilizan en otra sección. El registro histórico siguiente describe la prueba anterior, ya retirada.

Manuel quiere probar conservando la versión azul aprobada. Por el coste adicional observado se comunica una URL opt-in `/lab/orbes`, sin sustituir la portada. Tag remoto `checkpoint/approved-blue-orb-2026-09-17` apunta a b6fd0c1. No se modifica Hero, H1, esfera azul ni CSS público.

La ruta noindex abre la portada same-origin en iframe con título accesible. Al estar lista en formato móvil importa el motor cálido únicamente en el laboratorio; salida al portfolio y comparación dos/solo azul. Sin trackers, recursos de terceros ni API nuevos. El motor conserva shader, resolución y recorte aprobado; añade disposición de recursos GL, observers, listeners, RAF y estilos al salir/fallar. Context loss retira cálido y conserva azul. Reduced-motion detiene transferencias/brillo, o conserva solo fallback azul al entrar con la preferencia activada. No es física de fluidos ni garantía de FPS móvil.

Evidencia: REDc10e43 ruta inexistente; GREENcbe47d/ac75bc; Firefox desktop emulado390e4e93c; build final31rutas/tipos1e2653 y Chromiumfinalfb1363.277unitariasac75bc. Captura inspeccionada. Bundle43a549: portada138706raw idéntico;50637gzip vs50638. Nueva ruta76301raw/26940gzip; se añade únicamente su baseline, sin ampliar tolerancias ni presupuestos previos. Primer build medía67528raw antes de cambiar salida a Link; recompilado y medido nuevamente. Limpieza tsconfig elimina solo rutas temporales generadas por estos builds.

Limitaciones: más coste dentro de la prueba que con solo azul; no teléfono Android físico. No habilitar por defecto a partir de esta entrega. En desktop la entrada solo informa; para emular móvil hay que recargar tras reducir el ancho (mejora posterior: reaccionar al cambio de breakpoint sin recargar). Siguiente Manuel prueba visual mediante enlace; Codex cambios posteriores solo según decisión. No CMS/despliegue owner.

Publicado b9e3edd commit/pushcd610a. CI35235731178 ambosjobsSUCCESS ea6802. PreviewHJQWBFaweYWac4mYLrASW1xnXwJM vinculada al SHA por status96255f; redeploy con configuraciónproduction dpl_Cm99RiUpQXcAwZAbfqufMC1uLicH READY/aliasoriginal19fd76. URL https://manuelgarciallera.com/lab/orbes . LIVE Chromiumdf6384 y Firefox1be7d4 PASS formación, absorción, reduced, comparación, falloGL/azul preservado, salida y portada aislada. Logs error5minsinentradas9f040e, no monitorización continua. Servidores propios3033/3034/3035 detenidos4c397b, preview3032 original conservada. Tag azul remoto permanece intacto.
