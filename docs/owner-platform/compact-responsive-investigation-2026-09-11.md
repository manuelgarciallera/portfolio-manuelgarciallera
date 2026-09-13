# Investigación responsive compacta · 2026-09-11

Base: 77d0784. Solo arnés de pruebas; sin cambios de runtime ni despliegue.

Se añade `--compact-viewports` al ensayo production HTTP para ejecutar los
mismos recorridos a 320 y 768 px. Mantiene dos viewports y los mismos contadores
de persistencia. Los contextos menores de 1024 px habilitan capacidad táctil;
no son dispositivos físicos. Los commits y puntuaciones registrados son
fixtures sintéticos, no métricas ni versiones reales.

Primera ejecución: sesión 67985, salida 1, evidencia 1ff8f9.
Todo el recorrido de 320 px pasa: login, marca, páginas, descarte, medios,
captura/registro, preflight, restauración y artículo. A 768 px pasa login pero
el POST de perfil de marca devuelve 403 en browser-editor.mjs:56, esperado 201.
No es todavía un fallo demostrado de layout ni una causa de permisos conocida.
App y clúster propios cerrados, raíz sintética limpiada por el arnés.

Se añade al assert el cuerpo `errors` para diagnosticar el rechazo sin imprimir
cookies ni credenciales. Repetición en sesión 81888: salida 0 (5a24ce/239261).
Ambos viewports completan todos los recorridos; seis páginas, dos artículos,
relaciones y medios conservados tras reinicio; borradores e historial privados.
El 403 no se reprodujo: queda intermitente sin causa confirmada, no corregido.
No relajar acceso, no añadir reintentos para ocultar el fallo, no declarar verde.

Lint de los cinco archivos inicialmente modificados: df822a, salida 0.
Diff check final: 9948f1, salida 0. Lint de los seis archivos finales: 464a54,
salida 0. Checkpoint intacto en 0f0adf686b2752e23c25d224f8c60815b10fd451.
Reserva Hub: b3e1893d-6072-4117-aadd-94f448fced52.
Entorno: contenedor aislado owner-editor-6dc5c51-0911, copia verification-fac73fa
con overlays acumulados. No checkout limpio, instalación nueva ni staging real.

Siguiente responsable: Codex. Repetir el par original 390/1280 antes del commit.
Conservar el rechazo inicial; si reaparece, el assert mostrará errors. No atribuir
la repetición satisfactoria a una corrección inexistente.

## Reanudación 2026-09-12

- La sesión 83993 del par original no existe tras el cambio de entorno. Solo
  se observó login 390 antes de perder el handle; resultado completo desconocido.
- Docker no accesible: pipe docker_engine ausente y lectura de configuración
  denegada (7248c4). No se reinicia ni se altera el entorno para eludir permisos.
  `.git` está restringido a lectura: commit pendiente, sin intentar saltarlo.
- Lint final de seis archivos: 4245ba, salida 0. Diff check: 4320cb, salida 0.
- Suite local completa: 501790, salida 1; 1300 pasan y 1 falla por timeout del
  afterEach al limpiar el caso de más de 10.000 archivos. No fallo funcional
  demostrado del inventario. Repetición aislada sin cambios: 2cd8bb, 75/75,
  salida 0. Se conserva el primer fallo; no se suben timeouts para ocultarlo.
- Repetición completa sin cambios: 6b9c2f, salida 0, 1301/1301 en 170 archivos,
  60,07 s. No convierte el timeout anterior en corregido.
- Revisión independiente read-only review_compact_tests: sin defectos importantes
  en los seis archivos; no ejecutó pruebas ni atribuye cierre al 403.
  Copia histórica 77d0784 intacta. El cambio sigue sin commit y sin
  despliegue. La automatización temporal vencida se eliminó el 11 de septiembre.
- La entrega del resultado del día 12 al Hub fue rechazada por requerir aprobación
  bajo política `never`. Mensaje no enviado; entrega pendiente desde este recibo.

### Verificación adicional local del 12 de septiembre

- TypeScript del CMS: a3d345, salida 0. Archivos locales del editor sin CDN:
  362d0c, 1/1. Frontera pública: 9a1433, 21 entradas, salida 0.
- Integración con base temporal: sesión 69708, a71580, salida 0; 69 pruebas
  pasan y 22 omitidas, ocho archivos pasan y cuatro omitidos, 99,38 segundos.
  No acredita las puertas omitidas ni PostgreSQL de producción. Los rechazos
  de autenticación impresos pertenecen a casos negativos de la suite.
- Sin modificaciones adicionales de runtime, commit ni publicación. Sigue
  pendiente el acceso autorizado al navegador local para verificar visualmente
  la corrección del salto Contacto del portfolio. No se ha eludido la denegación.

### Recuperación física versionada del 12 de septiembre

- `node scripts/test-recovery.mjs --versioned-media`: sesión 80300,
  salida 0 (dc6038), sobre 77d078499304c4879ed489cb9b54f510808a7398.
  Los 45 tests auxiliares pasan (0788e6).
- Copia de 27 archivos, 26 medios verificados, tres versiones de medios,
  seis revisiones recuperadas y cuatro archivos históricos autenticados.
  Siete daños rechazados antes de asignar el destino; originales y copia
  permanecen iguales tras editar la restauración. Procesos cerrados antes
  de la limpieza propia del arnés.
- Alcance explícito: SQLite temporal, medios y previews congeladas con entradas
  mínimas de página/marca. No prueba toda la configuración, almacenamiento
  externo, PostgreSQL ni datos de producción. No se modifica runtime.
- El Hub permite lectura: devuelve pendientes históricos desde septiembre 8;
  no se toman como reservas nuevas ni como estado actual de producción. La
  entrega del resultado sigue pendiente; no se presume acuse de Claude.

### Reanudación del 13 de septiembre

Git vuelve a permitir escritura. Se conservan estos recibos en un commit documental;
los seis archivos del arnés permanecen sin commit hasta cerrar la regresión original.
La sesión Docker 9984 ya no existe. Nueva consulta Docker (643792) confirma motor
inaccesible; no hay agentes activos según la herramienta de coordinación local.
No se acredita resultado del proceso perdido ni se reinicia ninguna prueba por
un mero timeout. Sin despliegue y sin modificación de datos reales.
