# Editor real en ensayo productivo aislado

Base3751a33. ReservaHub97989125-1a27-4ef7-8f25-3daf863deebe. Solo cambia la infraestructura de pruebas, no el CMS ni el portfolio.

## Cobertura buscada

Completar el ensayo Next productivo con formulario Payload real: sesión cookie, edición de título/bloques, reordenación mediante teclado, guardado, recarga y previsualización a390/1280. El borrador inicial se crea por API desde la sesión del navegador, no mediante el formulario de creación. El resultado editado se compara contra la base tras reiniciar Next. No afirmar cobertura de creación por UI, imágenes/recorte, drag táctil, restauración visual o publicación externa por este ensayo.

## Diagnóstico del primer ensayo

Build y login móvil pasaban, pero crear el borrador devolvía403 (`749b61`). El navegador usaba HTTP127.0.0.1 mientras el runtime declaraba OWNER_SERVER_URL=https://owner.example.invalid: una prueba de edición con cookie debe usar el origen configurado. El ensayo anterior solo comprobaba lectura cookie; las escrituras se hacían con JWT. No es evidencia de fallo en un despliegue con origen correctamente configurado.

## Corrección del entorno de prueba

Proxy HTTPS efímero, solo127.0.0.1 y puerto asignado por el sistema, hacia el Next HTTP interno. Certificado de un día dentro de la raíz sintética; Chromium recibe únicamente el pin SPKI de esa clave. No ignoreHTTPSErrors, no almacén global de confianza, no desactivar CSRF, no excepción localhost en el runtime productivo. OWNER_SERVER_URL se ajusta al origen HTTPS exacto que abre el navegador. Los medios/objetos conservan su validación TLS independiente.

El proxy y los contextos se cierran al terminar; la raíz no debe eliminarse si el cierre de procesos/infraestructura no está confirmado. No usar este proxy ni las opciones Chromium en producción.

## Evidencia

- Sintaxis Node y diffcheck0 (`c53c51`).
- Segundo build/ensayo: ERR_CERT_AUTHORITY_INVALID antes de cargar el panel (`e7f42f`); app/clúster cerrados y raíz limpiada. No se ha verificado la edición por navegador.
- Nueva puerta `npm run test:production:editor`: preflight TLS antes del build y de crear la base. Falla explícitamente por la misma confianza TLS (`fae773`), sin degradar a HTTP ni desactivar verificaciones. Necesita un entorno que acepte el certificado efímero acotado; la causa de intercepción debe verificarse, no presumirse.
- El ensayo HTTP básico conserva su cobertura anterior y declara `browserEditor: not-run`; no sustituye la puerta HTTPS. Build/baseline de regreso salida0 (`033d07`): login390/1280, cookie, anónimo denegado y borrador HTTP tras reinicio; app/clúster cerrados y raíz limpiada.
- Revisión independiente señaló falta de AbortSignal en fetch del navegador y errores de stream upstream sin manejar. Corregidos: plazos de10s y destrucción de streams ante error/cierre. El preflight intenta cerrar todos los recursos aunque falle uno.
- Segunda revisión señaló pérdida del indicador childClosed de OpenSSL. Se conserva y condiciona la limpieza: si no se confirma su cierre, se retienen los archivos temporales. No se ejecutó una prueba de fallo de proceso para ese caso.
- Puerta HTTPS sigue fallando `f343a0`; el diagnóstico CDP no devuelve emisor, por tanto no se afirma que este fallo concreto provenga de AVG. No repetir builds para el mismo bloqueo.
- Frontera pública21, salida0 (`f256a0`). No cambios runtime ni nueva regresión unitaria completa;1251/164 corresponde al commit anterior.

Sin credenciales reales, coste, publicación, cambios de esquema ni rediseño. Emulación Chromium, no teléfono físico. Una prueba local no acredita alojamiento, correo o proveedor de objetos reales.
