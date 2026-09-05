# Comparación legible de propuestas

## Alcance

El documento de una propuesta de asistencia muestra ahora una comparación
«Antes / Propuesto», antes de sus controles de decisión. Conserva el estilo
nativo del panel y apila los valores en pantallas estrechas. No cambia la web
pública, el esquema de datos ni las dependencias.

`GET /api/owner/assist/proposals/:id` requiere una sesión owner, responde con
`Cache-Control: private, no-store` también en errores y realiza únicamente dos
lecturas autorizadas: propuesta y snapshot. Comprueba identificadores, relación
con la página, hash del manifiesto y capacidad del patch. Revalida las rutas,
tipos y límites usando el contrato existente. No consulta el borrador actual.

Las capacidades desactivadas no ocultan evidencia histórica. Leer una propuesta
no vuelve a activar un conector ni concede permiso de creación o aplicación.

## Semántica y límites

- Cada operación conserva su orden. Cuando varias afectan a la misma ruta, el
  valor anterior del siguiente paso es el resultado propuesto del anterior.
- Se distinguen texto vacío, valor nulo, campo eliminado y dato no capturado.
- El snapshot v1 no contiene el título de página ni las recetas de encuadre.
  Para esos campos se muestra **No guardado en esta versión**. No se inventa
  una línea base ni se lee el valor actual como si fuera histórico.
- La reordenación se resume como una lista de bloques con identidad y título;
  el contrato permite únicamente reordenar exactamente los mismos bloques.
- Los textos se renderizan como nodos React, no como HTML. No hay ejecución de
  código, renderizado de CSS propuesto ni nueva librería de comparación.
- La comparación persiste después de aceptar o rechazar la propuesta.
- Aceptar sigue significando registrar una decisión inmutable. **No aplica el
  patch**, no edita la página y no publica. Esto no es todavía una vista previa
  visual del diseño resultante ni una integración con un modelo de IA.

## Pruebas y revisión

32 nuevas pruebas unitarias cubren la comparación, el endpoint y el cliente:
secuencia, valores ausentes, reordenación, identidad, integridad, rutas,
autenticación, respuestas no cacheables y rechazo de respuestas malformadas.

La nueva integración SQLite usa configuración Payload, colecciones, sesión y
servicios reales. Guarda una propuesta, cambia después el borrador y comprueba
que la comparación conserva la línea base del snapshot. Desactiva la capacidad,
registra un rechazo y vuelve a comprobar la evidencia. La lectura no genera
escrituras de página ni auditoría. El primer intento de la prueba asumió que
la creación devolvía un ID de relación sin expandir; se corrigió ese supuesto
del fixture mediante una lectura `depth: 0`, sin modificar la persistencia.

`npm run test:controls` verifica 22 casos de navegador. Los componentes, CSS,
React y clientes son reales; el contexto Payload y el transporte están
sustituidos. Comprueba 1280/390 px, texto largo, escaping, confirmaciones,
ausencia de formularios anidados, teclado, carga, errores y propuestas ya
decididas. Las capturas revisadas quedan como artefactos locales ignorados:
`owner-platform/.data/verification-artifacts/assistance-review-1280.png` y
`assistance-review-390.png`. No son capturas de producción ni prueban una
llamada HTTP de extremo a extremo con el servidor Payload.

La revisión independiente de código no encontró problemas Critical/Important.
El cambio de ID con respuestas fuera de orden está protegido por identidad y
limpieza del efecto; queda como cobertura de navegador adicional, no como una
prueba ejecutada.

## Verificación completa

El check final (`npm run check`, con `VITEST_MAX_WORKERS=2` limitado al proceso
y restaurado después) terminó con exit 0: **653 unitarias en 141 archivos,
17 integraciones SQLite, lint, TypeScript y build owner**. La ejecución previa
sin límite pasó las 653 unitarias pero emitió avisos de timeout al cerrar varios
workers; se detuvo después por el supuesto incorrecto del fixture ya descrito.
El cierre intermitente de workers documentado anteriormente no se declara
resuelto por este único resultado con concurrencia limitada. No se cambió la
configuración permanente del ejecutor.

La suite de navegador terminó con exit 0 en sus **22 casos**. Las pruebas del
portfolio (207 unitarias), lint, TypeScript, 11 guardas públicas y 8 pruebas de
aislamiento también pasaron.

Un nuevo `build:public-proof` y `prove-owner-isolation.mjs` pasaron con base
`4553cd833ad9861d2601966840546ccbd7a1100d` y este incremento owner presente:
20 entradas sin importaciones privadas, 9 rutas sin regresiones, manifiesto de
dependencias y lockfile públicos iguales al checkpoint. El hash de entradas
públicas sigue siendo
`d1a37d1c6371728546ff096740c3837802c528deefdd901b130453a14dc44348`.
El checkpoint continúa en `0f0adf686b2752e23c25d224f8c60815b10fd451`.

Las auditorías npm permanecen bloqueantes (owner: 12 paquetes moderados;
portfolio: 1 moderado). No se desplegó, migró una base de producción ni se
activaron credenciales externas. Estos resultados locales no constituyen una
certificación de seguridad o disponibilidad en producción.
