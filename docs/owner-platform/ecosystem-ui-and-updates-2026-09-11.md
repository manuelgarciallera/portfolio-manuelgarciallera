# CMS, segunda web y ecosistema actualizable

## Decisión ejecutiva

Conservar el motor Payload instalado y cerrar una segunda página independiente
antes de sumar CRM y comercio al runtime. El criterio no es cuántas funciones
existen, sino si una persona puede crear, cambiar, comprobar y recuperar su web
sin modificar código. La interfaz debe tener identidad propia, pero no necesita
inventar gestos distintos de los controles que ya entiende el usuario.

La revisión local parte de 52d894b y del informe operational-gates del 11/09.
La consulta externa se realizó el 11/09/2026. Es un contraste incremental,
no una auditoría integral de Linocube ni una prueba comparativa de todos los
productos citados. No se han instalado los candidatos ni contratado servicios.

## Auditoría del estado y prioridad

El CMS contiene formularios, bloques, perfiles de marca, vista editorial,
versiones y medios. Los ensayos previos demuestran creación y edición de páginas,
ordenación por teclado, preview y conservación tras reiniciar Next en entorno
aislado. No prueban una web independiente publicada ni una operación comercial.
Los recibos distinguen pruebas sintéticas, integración y navegador real emulado.

La revisión del código confirma dos límites determinantes: el acceso sigue
siendo owner-only y readiness mantiene desactivadas publicación y puente público.
Faltan verificación del almacenamiento destino, correo de recuperación, copias
externas restauradas y revisión de despliegue. No retirar esos bloqueos porque
las pruebas locales estén verdes. Tampoco presentar 0.1.0 del package.json como
una medida objetiva de madurez: importan las tareas que se pueden completar.

La UI no debe esperar a que el producto esté vendido para comprobarse. Cada
incremento necesita uso por teclado, móvil, lectura de errores y recuperación;
después se valida comprensión con Manuel. El rediseño amplio permanece sujeto
a revisión previa. Una selección de fuentes con muestra es un cambio acotado;
un lienzo nuevo y sus reglas de composición son otro proyecto de interfaz.

## Referencias de UI y decisión de adopción

| Referencia | Capacidad documentada | Uso propuesto aquí |
| --- | --- | --- |
| React Aria de Adobe | Select y ColorPicker componibles, con estructura de etiquetas, ayuda y estados [1][2] | Referencia de interacción; no copiar una estética prefabricada ni añadir dependencia para sustituir un select nativo suficiente |
| Puck | Editor visual React con componentes propios y datos persistidos por la aplicación [3] | Candidato para composición guiada; no sustituye cuentas, permisos ni backups |
| Payload migrations | Migraciones versionadas y advertencias sobre diferencias entre configuración de desarrollo y producción [4] | Revisar migraciones en clon y probar compatibilidad; no actualizar esquema a ciegas |
| Twenty | Modelo de CRM extensible con objetos/campos/vistas descritos en código [5] | Referencia de estructura e interacción de CRM, no decisión de reemplazar Linocube |
| Medusa | Módulos con responsabilidades delimitadas y capacidades comerciales componibles [6] | Referencia para separar catálogo/pedidos/inventario, sin añadir una tienda al editor |

Puck documenta migraciones de datos y propiedades [7]. Nuestra conclusión es
que incorporar un constructor exigiría una representación canónica y conversión
sin pérdida: mantener dos árboles editables sería un riesgo. No hay un ganador
medido entre Puck y la evolución del editor actual; faltan ensayos comparables de
arrastre, teclado, móviles, deshacer, documentos antiguos y bundle.

La licencia de Twenty distingue el núcleo AGPL, archivos enterprise y paquetes
con MIT, entre ellos su biblioteca UI según el texto consultado [8]. No es una
autorización genérica para copiar el repositorio entero. Antes de reutilizar
código comercialmente, fijar versión, archivo, licencia y avisos aplicables;
este informe no sustituye esa revisión por artefacto. No se transfirió código.

## Primer incremento visual

Elegir familia de títulos y cuerpo mediante lista y ver una muestra real del
texto. Conservar el campo de nombre para familias existentes y personalizadas;
no convertir los valores antiguos a una enumeración cerrada ni perderlos al
abrir la página. La elección debe actualizar el mismo estado de Payload que
el campo de texto y bloquearse durante guardado o acceso de solo lectura.

Sin archivos de fuentes nuevos, el resultado depende de las fuentes instaladas
y del fallback. La muestra no garantiza igualdad tipográfica entre Windows,
Android y macOS. Para una identidad idéntica haría falta una selección posterior
de fuentes licenciadas, alojadas y presupuestadas. El control no debe prometer
que una familia local esté disponible en el dispositivo del visitante.

## Segunda página: prueba de producto, no otro portfolio

Propuesta de piloto con contenido sintético propio: una landing de un pequeño
estudio de servicios. Debe usar una marca y contenido independientes del
portfolio, con portada, texto, imagen, servicios y llamada a la acción dentro
de los bloques admitidos. No inventar testimonios reales ni reutilizar activos
de LALIGA o del TFM. No necesita dominio ni publicación pública para comenzar.

Prueba de cierre: crear desde el CMS, cambiar tipografía y color, sustituir y
encuadrar una imagen, reordenar, guardar, recargar, previsualizar y restaurar
una versión. Comprobar que la primera página no cambia. Posteriormente publicar
y revertir en un destino de prueba autorizado. Tener dos páginas en la misma
cuenta no acredita aislamiento entre clientes ni dos sitios completos.

## Integración con Linocube y comercio

Recomendación de producto: una experiencia común y módulos con límites claros.
La navegación, estados de guardado, errores, foco, tipografía y espaciado deben
tener vocabulario compartido; la marca de cada web se configura por separado.
Un tema no concede permisos. Un interruptor comercial no puede ser solo ocultar
un botón: el servidor debe impedir operaciones del módulo desactivado.

Antes de decidir monolito o varios despliegues hay que inspeccionar Linocube.
No se ha hecho en este incremento. No debe deducirse que compartir React o
PostgreSQL permite compartir automáticamente sesiones y tablas. Propuesta de
primer contrato, aún no implementado: una consulta consentida de la web crea
un contacto/seguimiento en CRM, con identificador de organización, evento único,
versión, procedencia y permisos mínimos. Reintentar no debe duplicar el contacto;
un fallo debe ser visible y recuperable. No enviar todo el formulario a todos
los módulos ni usar datos personales para experimentos por defecto.

Para comercio, el CMS describe páginas y contenido; el módulo comercial posee
precios, inventario, pedidos y pagos. El CRM recibe únicamente acontecimientos
necesarios y autorizados. Elegir un proveedor de pago o reutilizar el TFM exige
revisión específica; no está resuelto por este esquema conceptual. La primera
prueba debe ser con pedidos y pagos de prueba, nunca transacciones reales.

## Actualizaciones para clientes

El repositorio ya declara Dependabot semanal para owner-platform, agrupa
Payload/Next/React y excluye majors automáticos. La CI owner ejecuta check con
unitarias, integración SQLite, lint, tipos y build. Se ha inspeccionado la
configuración; no se afirma que existan PR abiertos o ejecuciones remotas verdes.
Los ensayos PostgreSQL, navegador HTTPS y objetos actuales no aparecen como
pasos propios en esa CI: la verificación local no los convierte en gates remotos.

El sistema de entrega propuesto separa versión de aplicación, esquema de datos,
formato de bloques y tema. Cada release debe incluir compatibilidad declarada,
migraciones, prueba de datos de versión anterior, artefacto identificable,
notas comprensibles y reversión ensayada. Hacer rollback de Git no recupera por
sí solo una base migrada ni archivos borrados. Las migraciones destructivas
requieren una copia recuperable y una ventana controlada.

Orden recomendado: propuesta de dependencia → pruebas y clon restaurable →
piloto propio → aceptación → despliegue controlado a clientes compatibles.
No auto-merge ni actualización indiscriminada por defecto. Primero demostrar
una actualización completa y una recuperación fallida de forma controlada;
después automatizar ese procedimiento. Un panel futuro puede mostrar versión,
compatibilidad y notas, pero no debe presentar un botón seguro de actualizar
antes de que exista ese mecanismo detrás.

## Hitos de cierre

1. Selector visual persistente y compatible, verificado sin alterar el público.
2. Segunda página editable y recuperable, revisada por Manuel.
3. Staging con correo, objetos y restauración real; publicación de prueba fiel.
4. Ensayo de actualización desde una versión anterior con recuperación.
5. Contrato de integración revisado con Linocube y prueba sintética independiente.
6. Piloto comercial solo después de aislamiento, operación y soporte comprobados.

No hay plazo de entrega comercial garantizado ni promesa de coste cero. La meta
de estos días es una prueba utilizable y honesta, no etiquetar como terminado
un ecosistema que todavía requiere decisiones, infraestructura y validación.

## Fuentes

Documentación mutable consultada el 11/09/2026; no auditoría de todos los commits.

1. Adobe, [React Aria Select](https://react-aria.adobe.com/Select).
2. Adobe, [React Aria ColorPicker](https://react-aria.adobe.com/ColorPicker).
3. Puck, [repositorio y ejemplo de integración](https://github.com/puckeditor/puck).
4. Payload, [Migrations](https://payloadcms.com/docs/database/migrations).
5. Twenty, [repositorio y modelo de extensiones](https://github.com/twentyhq/twenty).
6. Medusa, [Modules](https://docs.medusajs.com/learn/fundamentals/modules).
7. Puck, [Data Migration](https://puckeditor.com/docs/integrating-puck/data-migration).
8. Twenty, [LICENSE](https://raw.githubusercontent.com/twentyhq/twenty/main/LICENSE).
