# Revisiones de imágenes: método de medición previo a la activación

Estado: preparación de Task 5 mientras Task 4 verifica recuperación física.
No es un benchmark ejecutado ni autorización de alojamiento, migración o publicación.
El código de referencia es `00dd241`, con la integración HTTP de `339fb8d` y
`cf28533`. El ensayo final debe identificar su commit exacto y consumir la
recuperación revisada, no una copia paralela de su transporte.

## Riesgos observados en código

- `revision-store.ts` limita cada revisión a 16 archivos y 64 MiB agregados.
  Ese límite no limita la memoria total de varias solicitudes concurrentes.
- `readMediaRevision` valida y conserva los buffers de todos los archivos de la
  revisión antes de devolverlos, aunque la solicitud necesite solo un derivado.
- El endpoint de `revision-storage-binding.ts` crea además un `Uint8Array` con
  los bytes seleccionados. No se debe eliminar la validación completa de la
  revisión para obtener artificialmente un resultado más rápido.
- El servidor de ensayo `http-fixture.ts` materializa la respuesta mediante
  `arrayBuffer()` y `Buffer.from()`. Su memoria incluye ese transporte de prueba;
  no equivale directamente al consumo de Next.js ni de un proveedor desplegado.
- El límite de petición del fixture es 8 MiB. Probar una revisión cercana a
  64 MiB no justifica aumentar silenciosamente ese límite: puede sembrarse por
  la integración local real de Payload y medir después la descarga HTTP real,
  identificando expresamente ambas vías.

## Método que deberá concretar Task 5

1. Utilizar únicamente imágenes sintéticas con dimensiones y contenido conocidos.
   Registrar el peso real del original y de cada derivado, no solo las dimensiones.
   Incluir un conjunto habitual y otro cercano al límite agregado admitido.
2. Separar el proceso que sirve los archivos del que solicita y consume las
   respuestas. Así el RSS del cliente no se atribuye al servidor. Si alguna
   medición combina ambos, etiquetarla como tal y no compararla como equivalente.
3. Medir primero en serie y después con concurrencia pequeña, explícita y acotada.
   No solapar el benchmark con builds u otros ensayos pesados. Registrar número
   de solicitudes, calentamiento, duración, errores y bytes efectivamente recibidos.
4. Recoger RSS, heap, memoria externa y buffers del proceso servidor; distinguir
   valor de partida, máximo observado y valor final. Documentar el intervalo de
   muestreo: un pico observado no garantiza capturar el máximo instantáneo.
5. Medir latencia de respuesta completa, no solo cabeceras, y comprobar hashes.
   Describir la caché del sistema operativo como no controlada; no llamar
   «lectura en frío» a una segunda lectura del mismo archivo.
6. Registrar Node, sistema operativo, arquitectura, memoria disponible, motor de
   base de datos, commit y comando reproducible. Los resultados locales orientan
   el siguiente paso; no certifican capacidad de producción ni Core Web Vitals.
7. Fijar el presupuesto y el criterio de aceptación antes de interpretar los
   resultados. Si aparece un consumo inaceptable, reproducirlo y corregirlo con
   pruebas sin debilitar permisos, integridad o límites. No escoger después un
   umbral que simplemente haga pasar la medición obtenida.

## Límites que siguen abiertos

La prueba local no demuestra persistencia tras un despliegue, aislamiento entre
clientes, permisos efectivos del volumen, copia externa o coste operativo.
La raíz de revisiones debe ser privada y quedar fuera de cualquier montaje
estático. La política de retención debe contemplar versiones, borradores,
instantáneas y revisiones huérfanas; no borrar por no aparecer en el documento
actual. La activación necesita un procedimiento ensayado de migración y vuelta
atrás que preserve tanto base de datos como archivos.

PDF del CV y fuentes personalizadas siguen siendo capacidades posteriores con
validaciones propias. Este trabajo no publica documentos ni modifica la web pública.
