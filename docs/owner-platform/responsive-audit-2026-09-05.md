# Auditoría responsive del CMS: acceso, dashboard y borradores

## Alcance y protección

Auditoría sobre el código posterior a `48a591d`, en una instancia temporal
loopback con SQLite y un owner ficticio. No se emplearon contenidos, cuentas,
credenciales de proveedores ni bases de producción. El checkpoint
`checkpoint/pre-editor-2026-09-04` sigue apuntando a
`0f0adf686b2752e23c25d224f8c60815b10fd451`.

La pestaña antigua de localhost:3001 conservaba un error sin servidor escuchando:
ese estado obsoleto no demuestra un fallo actual del CMS. Las comprobaciones
visuales se hicieron en una nueva instancia en 127.0.0.1:3011.

## Recorrido observado

1. **Acceso owner — verificado.** Bootstrap restringido y login con cuenta
   sintética. El rechazo inicial de un secreto de bootstrap demasiado corto
   fue correcto; se cambió únicamente la credencial de prueba.
2. **Dashboard móvil — corregido.** Los seis accesos de creación medían unos
   34,8 px de alto y el buscador unos 33 px. Ahora tienen un mínimo de 44 px
   hasta 768 px, sin modificar la escala desktop. El campo de búsqueda tiene
   un mínimo de 16 px de texto. Son objetivos de comodidad táctil; no se
   presenta el tamaño previo como prueba automática de incumplimiento WCAG AA.
3. **Crear página — verificado.** Desde el formulario móvil se creó
   «Página de prueba responsive», slug `qa-responsive`, con un bloque Hero
   y su titular. Guardado como borrador, sin perfil de marca ni publicación.
4. **Persistencia — verificada.** Recargar el formulario conservó título,
   slug y titular; la interfaz mostró estado Draft y una versión.
5. **Preview — verificado con límite.** La ruta privada mostró el contenido
   guardado y el aviso de base neutra por no tener marca. Esta vista editorial
   no equivale a la dirección artística ni a las animaciones del portfolio.
6. **Desktop — inspeccionado.** Dashboard a 1280 px con accesos en fila,
   métricas en columnas y buscador horizontal. Altura observada de los accesos:
   aproximadamente 35,9 px, conservando su diseño compacto.

Capturas de esta ejecución, guardadas e inspeccionadas en
`owner-platform/.data/ux-audit-2026-09-05/`:

- `01-dashboard-mobile-before.jpg`
- `02-preview-mobile.jpg`
- `03-dashboard-mobile-after.jpg`
- `04-dashboard-desktop.jpg`

Una primera captura desktop se descartó por capturar la transición del cambio
de viewport; la conservada corresponde al render estable de 1280 px.

## Regresiones añadidas

`npm --prefix owner-platform run test:dashboard` renderiza los componentes
reales OwnerSearch y OwnerOverview con su CSS. Solo sustituye HTTP y Next Link;
no reproduce el shell completo de Payload ni certifica persistencia.

La matriz cubre 320, 390, 768 y 1280 px en claro y oscuro, con raíz tipográfica
compacta de 12 px: seis accesos, límites del viewport, objetivos táctiles,
escala desktop, orden de teclado, foco visible y envío de búsqueda con Enter.
Un título sin espacios largo expuso un desbordamiento real adicional en los
resultados: ahora se ajusta dentro del ancho disponible, sin truncar contenido.

El ciclo RED falló en las ocho combinaciones (targets pequeños en móvil/tablet
y desbordamiento en desktop); tras corregir el CSS, las ocho pasaron.
No se añadieron dependencias ni se editaron componentes del portfolio.

## Verificación final de este incremento

- Unitarias owner: **687 / 141 archivos**, exit 0, dos workers.
- Integración SQLite: **20**, exit 0. El aviso de correo sin adaptador confirma
  que la recuperación de cuenta real sigue pendiente, no que se haya probado.
- ESLint, TypeScript y build owner: **exit 0**, 23 páginas generadas.
- Controles de revisión: **22 casos browser**, exit 0.
- Dashboard responsive: **8 combinaciones**, exit 0, repetido tras consolidar CSS.
- Aislamiento del checkpoint: **8 pruebas**, exit 0; frontera pública:
  **20 entradas**, exit 0. El mensaje de hash Git inválido pertenece a una
  prueba negativa deliberada del verificador.
- `npm --prefix owner-platform audit --omit=dev --json`: **exit 1**, doce
  paquetes moderados afectados por las cadenas Payload y esbuild. No se ejecutó
  `audit fix --force` ni se cambió el lockfile.

La compilación pública, Lighthouse, Safari/iOS y la auditoría de producción
no se repitieron en este incremento. No se extrapolan resultados antiguos.
La instancia temporal dejó de escuchar antes del build; no se eliminó su
base de prueba ni se inició ningún despliegue.

## Pendientes priorizados

- **P1 / antes de producción:** infraestructura PostgreSQL, almacenamiento y
  recuperación de cuenta reales; ensayo de restauración y seguridad de
  dependencias. No quedan certificados por este recorrido local.
- **P1 / edición asistida completa:** aplicar propuestas reversiblemente al
  borrador con control de concurrencia. Aceptarlas sigue siendo una decisión
  auditada, no una edición aplicada.
- **P2 / comprensión:** unificar el idioma del shell y de los campos; sustituir
  o explicar términos como preflight, snapshot y artefacto para el owner.
- **P2 / cobertura UX:** extender recorridos reales a artículos enriquecidos,
  sustitución/encuadre de imágenes, reordenación, errores y recuperación, en
  móvil y desktop; el recorrido de una página no acredita todos los editores.
- **P2 / accesibilidad:** comprobar lector de pantalla, zoom, contraste completo,
  teclado en diálogos y dispositivos táctiles reales. Las capturas y la matriz
  de Chromium no constituyen certificación WCAG ni pruebas Safari/iOS.
- **Puente público:** sigue desactivado. La comparación visual y de rendimiento
  de ese puente será necesaria antes de integrar contenido en el portfolio.

La guía de auditoría UX/UI orientó la captura por pasos y las correcciones
basadas en mediciones; no se hizo un rediseño del panel ni de la web pública.
