# Respaldo sintético: rechazo de raíces y archivos enlazados

Despertar temporal10:30UTC. Base `9cc1a060ef94bf47fa9b87d73738438f86db48e8`.
Alcance: `tests/recovery/backup-manifest.mjs` y su prueba; **solo QA**. El contrato
del candidato, su cobertura y sus bytes ya se ensayaron; no se repiten clones de
SQLite/PostgreSQL ni se inventa un ejecutor para avanzar una casilla.

## Hallazgo reproducido

El recorrido comprobaba enlaces simbólicos descendientes, pero `readdir(root)`
seguía una raíz junction sin comprobarla. Además, `readFile` leía archivos con
otro hardlink escribible sin distinguirlos de una copia independiente.

Cuatro fixtures de Windows reprodujeron aceptación incorrecta:

- Fuente con raíz junction: creaba el backup.
- Backup con raíz junction: restauraba el destino.
- Archivo de base con hardlink adicional: aceptaba la copia.
- Manifiesto con hardlink adicional: aceptaba la restauración.

El contenido podía coincidir en ese instante: la huella no demuestra aislamiento
de escritores ni convierte un alias en una copia independiente.

## Corrección mínima

`lstat` exige directorios reales en cada visita y en la raíz del backup antes de
leer su manifiesto. Los archivos, incluido el manifiesto, deben ser regulares y
tener `nlink === 1`; enlaces simbólicos/junction o hardlinks se rechazan. En los
casos fuente el rechazo precede a `mkdir(backup)`, y en los casos de restauración
precede a `mkdir(restore)`. No se renombran, borran o convierten enlaces existentes.

**Límite:** inspección de un fixture en reposo, no protección atómica contra
escritores hostiles. No autentica ancestros, identidad del host, backup o pin;
persiste una ventana entre inspección y lectura/copia. No usar este helper como
control de seguridad operativo. Las pruebas usan enlaces dentro de raíces
temporales creadas para el ensayo, no bibliotecas ni bases reales.

## Pruebas

- Primer comando con configuración unitaria por defecto: no encontró `.mjs`;
  salida1 de configuración, no RED funcional.
- Con `vitest.recovery.config.ts`, cuatro nuevos RED funcionales: la promesa
  resolvía en los cuatro casos. Las cuatro pruebas originales seguían pasando.
- Tras corregir, suite de recuperación **45/45 en5archivos**, sesión48306,
  salida0,12,13s. Incluye respaldo/restauración independientes y fallos anteriores.
- Lint focal82129 salida0. No nueva suite global, build/UI o pruebas de BD: no hay
  cambio en módulos de producción, schemas, conexiones o frontend.
- Revisión independiente estática completada sobre ambos archivos: sin Critical,
  Important o Minor. No se atribuyen ejecuciones al revisor; confirmó también el
  límite de ancestros y sustitución concurrente de rutas.

## Coordinación y continuidad

Reserva Hub `70bd8acd-e261-4254-9c92-0d93d85f34cf`, enviada a Claude sin aceptación
inferida. Sin cambios públicos, push/despliegue, activación, costes, DNS/correo o
datos reales. Checkpoints y archivos ajenos conservados.

Próximo Codex: procedencia y persistencia del pin, respaldo restaurado y protocolo
operativo de escritores detenidos. Esta corrección refuerza el ensayo; no cubre
esas puertas ni declara el CMS comercialmente listo.
