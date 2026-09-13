# Mantenimiento automatizado con revisión

Fecha: 2026-09-05. Base: `d4a785f`. Configuración local, sin push ni despliegue.

## Seguimiento · 13 de septiembre de 2026

Sobre la base `81d87c0`, el comando local `check` incorpora los dos ensayos
existentes de recuperación física SQLite: esquema completo y medios versionados.
Se ejecutan después de integración y antes de lint/tipos/build mediante `&&`:
un fallo impide continuar. No se modifica el workflow de GitHub ni se solicitan
credenciales, gasto, ejecución remota o despliegue.

Motivo concreto: el ensayo de esquema completo detectó una inicialización
incorrecta del secreto sintético antes del import de configuración, reparada en
`81d87c0`. Al no formar parte de `check`, esa puerta quedaba fuera de la
comprobación normal. Las cifras de abajo son históricas; la ejecución conjunta
de esta ampliación debe verificarse antes de su cierre.

Primera ejecución ampliada, sesión 31958: 23 pruebas de scripts, 1.346 unitarias,
70 integraciones (24 exclusivas de PostgreSQL omitidas) y ambos ensayos físicos
completados. Se detiene con salida 1 en lint (425e5b): el diagnóstico CA añadido
usaba CommonJS. Se convierte a `.mjs` sin excepciones de lint; su prueba de
confianza vuelve a pasar con 247 certificados y digest idéntico (505ea3).
La compilación posterior termina con 23 páginas (101e2a). La cadena completa
sobre el commit corregido queda pendiente de repetición; no se afirma CI verde.
Commit `230278e`: repetición completa de `npm run check`, sesión local 56720,
finalizada con salida 0 (5bfa74). Pasan 23 pruebas de scripts, 1.346 unitarias,
70 integraciones (24 PostgreSQL omitidas), los dos ensayos físicos con sus 47
auxiliares, lint completo, tipos y build de 23 páginas. Las recuperaciones
informan el SHA 230278e, conservan origen/respaldo y cierran antes de continuar.
No hubo reinicio de la ejecución. El fatal/errores de los casos negativos no
se confunden con fallos de la suite.

Bundle local `.audit/owner-night-230278e.bundle` verificado (2db1f9): contiene
HEAD 230278e y requiere 11f75eb. No es copia externa ni respaldo de datos.
La prueba usa dependencias ya instaladas en Windows; no acredita `npm ci`
limpio en Ubuntu, CI remota, PostgreSQL alojado ni servicios de producción.

### Instalación limpia en curso

El intento Linux en `/tmp/owner-clean-install-yQ9arX/repo`, checkout limpio
230278e sin node_modules y caché npm nueva, terminó con EAI_AGAIN al resolver
registry.npmjs.org (18483 / d2a135). `strict-ssl` era true y el lock coincide
con el revisado. Windows resuelve el mismo nombre; el lookup en el contenedor
repite EAI_AGAIN (236946). No se cambiaron DNS ni TLS para ocultar el fallo.

Alternativa separada: checkout Windows independiente
`.audit/owner-clean-install-230278e`, sin node_modules (b87c53), sobre el mismo
SHA. `npm ci` con caché nueva termina 0 (92101 / 8f2838): 729 paquetes en
tres minutos y postinstall ejecutado. `npm ls --depth=0` termina 0; el lock
conserva SHA-256 6d137a173cb560f26029e77fef1a1691c783c34fc567c6836b7c5c729f2d93fc
(83728b). Sin cambios rastreados; solo npm-cache/ sin seguimiento en el clon.
No se copió node_modules. Los avisos de obsolescencia no se trataron como
autorización para actualizar versiones durante el ensayo.

`npm run check` del checkout Windows nuevo, sesión 52629, finaliza con salida 0
(6bd787): 23 pruebas de scripts, 1.346 unitarias, integración SQLite, recuperación
completa y versionada, lint, tipos y primer build de 23 páginas. Las dos
recuperaciones identifican el SHA 230278e y preservan origen/respaldo (94cc91,
4c3568). La integración de este comando omite los casos exclusivos PostgreSQL;
no los valida por pasar en Windows. El build frío compiló en 30,1 s y su fase
TypeScript tardó 21,7 s, sin límite de rendimiento deducido de un único ensayo.

Esto acredita instalación desde lockfile y comprobación completa local en
Windows, sin reutilizar dependencias. La puerta Linux sigue impedida por DNS,
y ni esta copia de QA ni el resultado equivalen a staging o backup externo.

### Controles de navegador tras instalación limpia

En el mismo checkout 230278e se ejecutaron `npm run test:dashboard && npm run
test:controls`, sesión 2516, salida 0 (ebbe3d). Dashboard: ocho combinaciones
320/390/768/1280 claro/oscuro, ajuste al viewport, controles táctiles, búsqueda
y orden de teclado. Acciones editoriales: 22 comprobaciones a 390/1280,
incluyendo aprobación/rechazo y revisión/error de asistencia archivada.

Inspección visual de `.data/verification-artifacts/assistance-review-390.png`
y `assistance-review-1280.png` del clon: comparación apilada en móvil, foco
visible, texto largo ajustado y marcado adversarial representado como texto.
No se han modificado componentes ni datos. El clon sigue sin cambios rastreados
(277009). Son componentes reales montados con API/contexto sintéticos, no
sesión completa Payload ni conexión real a proveedores o validación humana de
usabilidad. Los navegadores de los harnesses cerraron al terminar.

## Carencia encontrada

La CI existente solo instalaba y comprobaba el paquete raíz. Una actualización
del CMS podía pasar por esa CI sin ejecutar las pruebas ni el build del owner.
Tampoco existía configuración de propuestas automáticas de actualización.

## Configuración incorporada

- Se conserva el job `validate` del portfolio y sus barreras de bundle y
  seguridad. Se añaden pruebas unitarias, pruebas de las guardas de aislamiento,
  encoding, hero y comprobaciones estructurales responsive.
- El job independiente `owner` instala su propio lockfile y ejecuta `check`:
  unitarias, integración SQLite temporal, lint, tipos y build. Usa dos workers
  para evitar saturación. Audita además dependencias de runtime, incluso cuando
  otra comprobación falla, salvo cancelación. No requiere credenciales owner.
- Ambos usan Node 24, compatible con el Node local utilizado en la verificación.
  Checkout y setup-node se fijan por SHA de sus referencias oficiales v6,
  comprobadas con `git ls-remote`; no se siguen tags flotantes al ejecutar CI.
- Token de CI de solo lectura, checkout sin credenciales persistentes,
  timeout de 30 minutos y cancelación de ejecuciones sustituidas de la misma ref.
  No se utiliza `pull_request_target`, secretos de producción, auto-merge ni
  comandos de publicación.
- Dependabot propone semanalmente actualizaciones de `/owner-platform` y de
  GitHub Actions. Payload, Next y React tienen grupos de versiones compatibles
  para revisión. Las propuestas rutinarias npm excluyen saltos major y esperan
  siete días desde la publicación. Los grupos no garantizan compatibilidad: la
  resolución de peers, las pruebas y la revisión siguen siendo obligatorias.
- El npm público queda fuera de propuestas automáticas de versión para conservar
  la comparación con el checkpoint. No se silencian sus alertas de seguridad.

Se siguen las opciones documentadas de
[Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
y los principios de permisos mínimos y fijación por SHA de
[GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use).
El cooldown no retrasa actualizaciones de seguridad; una corrección que necesite
un major puede requerir intervención manual por la regla de exclusión.

## Verificación y límites

Los YAML se analizaron con js-yaml y se validaron con Ajv contra los esquemas
de SchemaStore `dependabot-2.0.json` y `github-workflow.json`: exit 0. El Ajv 6
disponible emitió avisos sobre keywords hermanas de `$ref` en el esquema Actions;
esto es validación de formato, no ejecución del motor de GitHub. No se añadieron
dependencias para esta comprobación. Se usó el almacén CA del sistema para
verificar TLS, sin desactivar la validación de certificados.

Comandos locales con Node 24.13.0:

- Owner `check`: 653 pruebas unitarias en 141 archivos, 17 integraciones SQLite,
  lint, tipos y build correctos; exit 0. La integración avisa que no hay adaptador
  de correo, como corresponde al entorno sintético.
- Portfolio: 207 unitarias y 8 pruebas de aislamiento correctas; exit 0.
- Portfolio `check:all`: guardas 11/11, frontera de 20 entradas, encoding, hero,
  responsive estructural, lint, tipos, build y bundle de 9 rutas correctos.
  Termina exit 1 por la vulnerabilidad moderada existente de `fflate`.
- Auditoría owner de runtime: 12 paquetes moderados afectados por las cadenas
  Payload y esbuild; exit 1. No se considera una CI completamente verde.
- Revisión independiente de scripts, imports y configuración: sin incidencias
  detectadas; no requiere instalar el paquete raíz para `owner check`.

No se presenta una validación estática del YAML como prueba de ejecución remota
o del bot. No se han añadido tests que solo comparen el texto del YAML: se
validó su esquema y se ejecutaron los comandos reales, con los límites indicados.

## Activación pendiente y operación

1. Revisar este commit y llevarlo mediante PR a la rama por defecto. Aquí no
   se ha publicado ninguna rama ni creado PRs.
2. Ejecutar y comprobar ambos jobs en el runner Ubuntu de GitHub, incluido un
   checkout limpio sin dependencias heredadas del equipo local.
3. Configurar las reglas del repositorio para exigir `validate` y `owner`, con
   revisión humana. Tener jobs definidos no los convierte automáticamente en
   comprobaciones obligatorias; no se han cambiado ajustes remotos.
4. Confirmar Dependabot habilitado y su primer resultado. Version updates,
   alertas y security updates son ajustes relacionados pero distintos.
5. Resolver las auditorías pendientes antes de aprobar una actualización. No
   se permite `audit fix --force`, ignorar el job o bajar el nivel de auditoría
   para fabricar un resultado verde.

Las pruebas de navegador, visuales y Lighthouse siguen formando parte de la
revisión previa a publicar; este incremento no las integra aún en CI ni resuelve
la conexión intermitente de Storybook. Tampoco acredita PostgreSQL, almacenamiento
duradero, entrega de correo ni conectores externos. No se modifica la integración
Git de Vercel: si existe despliegue automático remoto, estas comprobaciones no
lo bloquean por sí solas. Su política debe revisarse antes de subir cambios.

Las propuestas y CI pueden consumir cuota del repositorio. La cadencia semanal,
los límites de PRs y la cancelación reducen trabajo redundante; no se promete
coste cero ni se activa facturación. El contenido, el diseño, los manifiestos
npm y los lockfiles de ambas aplicaciones permanecen intactos.
