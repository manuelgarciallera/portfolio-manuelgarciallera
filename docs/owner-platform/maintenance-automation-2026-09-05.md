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
