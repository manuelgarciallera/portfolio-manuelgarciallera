# Tipografía editorial: recorrido del dato a la vista previa

Fecha: 2026-09-10. Base: `7f7cffa`. Reserva Hub: `9c568815-350b-4ff4-9292-a51dcc7f046c`.

## Defecto y alcance

BrandProfiles almacenaba primaryFamily/secondaryFamily pero resolvePageBrand las omitía. La vista previa no podía reflejar esos controles y las capturas no conservaban las familias.

- Familia primaria: títulos; secundaria: cuerpo. Etiquetas y ayuda explícitas en el editor.
- Nombres opcionales de hasta 100 caracteres (letras Unicode, números, espacios, guiones y guiones bajos); no se aceptan listas, CSS ni URL. Nombres vacíos conservan el comportamiento anterior.
- Resolver copia únicamente los nombres normalizados, nunca relaciones fontAssets. Publicación valida el formato; render valida de nuevo y tiene fallback seguro.
- Las capturas nuevas conservan nombres y cambian su hash al cambiar de familia. Las antiguas sin tipografía no reciben nuevas claves ni un override de títulos: conservan la cascada anterior.
- No se añade ninguna fuente, dependencia, @font-face o solicitud de descarga. Una fuente ya declarada por otra hoja sigue su comportamiento habitual. No garantiza idéntico aspecto entre sistemas operativos.

## Verificación y revisión

- RED `8a50e9`: seis fallos esperados en propagación, formato y SSR; GREEN focal inicial: 25/25.
- Revisión independiente detectó P2 de compatibilidad: imponer system-ui a encabezados legacy podía sustituir la pila de Payload. Corregido con atributo y selector condicional; revisión posterior sin bloqueadores.
- Focal final `b87cd5`: 86 pruebas, 9 archivos, salida 0. Incluye persistencia del nombre en captura anterior, nuevo hash y proyección histórica sin consultar la marca actual.
- Chromium, componente SSR y CSS real compilados en memoria, `de469c`: a 390 y 1280 px, heading Georgia, cuerpo monospace y sin overflow horizontal. Primera ejecución del arnés falló antes de abrir navegador por filename ausente; corregido el arnés. No equivale a prueba end-to-end del panel, comparación visual de capturas, Safari o teléfono físico.
- Frontera pública `61cb2f`: 21 entradas, salida 0. No se modifica la web pública, esquema, proveedor, datos reales o checkpoint.

- Batería final `dfef1c`: **1204/1204 pruebas, 162 archivos**, 155,23 s, salida 0. Se repitió después de descartar un pase que coincidió con el ajuste de revisión (mezcló componente anterior y test actualizado; 1 fallo).
- Tipos estrictos, lint y diff check `64b76c`: salida 0. No se ha ejecutado un nuevo build productivo ni desplegado este cambio.

## Pendientes delimitados

Fuentes subidas y PDF requieren tratamiento de archivos propio; no se habilitan aquí. Sigue pendiente verificar almacenamiento, credenciales y copias externas con un proveedor real antes de considerar listo el CMS alojado. Codex integra y verifica; Claude recibe el resultado para revisión por el Hub. Envío no equivale a acuse ni aprobación.
