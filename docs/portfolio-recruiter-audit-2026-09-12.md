# Auditoría previa a recruiters · 12 septiembre 2026

Estado: parcial, no aptitud final acreditada. Producción inspeccionada con el
navegador integrado; código local HEAD 77d0784. No equivalencia de despliegue
demostrada, no cambios de runtime, no publicación.

## Prioridad P1: destino Contacto desde el hero móvil

En producción a 390×844, partir del hero y pulsar Contacto cambia la URL a
/#contacto, pero deja la pantalla en los proyectos de NudeProject y el blog.
Dos observaciones posteriores: scrollY 8210,4004 y rect.top de #contacto
3616,8875. El formulario sigue fuera de pantalla. La existencia del ancla no
demuestra navegación correcta. No se envió ningún mensaje real.

Hipótesis a contrastar, NO causa probada: content-visibility:auto y las alturas
intrínsecas de secciones cambian la geometría durante scroll suave. Localmente
responsive.css difiere la composición de capítulos y globals.css activa smooth.
Próxima prueba: reproducir desde carga nueva, verificar llegada a formulario,
probar ajuste mínimo y contrastar también enlaces desde páginas interiores,
320/390/768/1440 y movimiento reducido. No quitar optimizaciones a ciegas.

## Observaciones verificadas

- Hero móvil: una esfera, nombre Manuel García-Llera Añón completo en tres
  líneas; sin solapamiento observado en la captura. Desktop1440: una esfera y
  nombre completo con refracción; no se modifica dirección de arte.
- Menú móvil abre, expone navegación, Escape cierra y devuelve foco al botón.
- Sobre mí: notas9,86 Full Stack y9,56 UX; selector de CV abre enlaces ES/EN
  fechados7sept. Descarga/bytes/contenido PDF todavía no comprobados.
- Inspección estructural desktop de proceso, investigación, casos, cinco casos
  individuales e índice artículos: títulos específicos, un h1, sin imagen rota
  entre las cargadas, sin anchura de documento excesiva. Misma inspección móvil
  de sobre-mi, investigación, casos, cinco casos e índice artículos.
- La medida scrollWidth no detecta por sí sola recortes internos; no acredita
  ausencia de solapamientos. Tampoco se ha recorrido toda imagen diferida.
- Proceso390: primera imagen sobre Encuadre y columna legible; tres imágenes
  cargadas con ancho natural663 para unos342CSSpx. No extrapolar a todos los assets.
- Capacidades: imágenes observadas326px para311CSSpx. Revisar originales para
  pantallas de densidad alta; no afirmar HD ni ampliar artificialmente.
- Consola de la pestaña: dos avisos de THREE.Clock obsoleto; sin errores registrados
  en esa lectura. No es una prueba universal de consola limpia.
- Unitarias públicas locales: 224/224 en37archivos, salida0 (5a503e).

## Bloqueo de comprobación local

Servidor local iniciado en127.0.0.1:3105. El navegador deniega explícitamente
acceso a esa URL; no se intenta otra superficie ni vía indirecta. Hace falta
permiso del usuario antes de validar cambios visuales locales. Git solo lectura
según entorno vigente; no commits ni push. Hub previamente rechazaba envíos;
esta entrega queda local, no se afirma que Claude la haya recibido.

## Puertas restantes antes de declarar listo

1. Corregir y verificar Contacto, incluida llegada real y validación del formulario.
2. Recorrido completo de todas las páginas en ambos temas, teclado, móvil y desktop;
   imágenes diferidas, carruseles, foco, recortes y controles táctiles.
3. Comprobar PDFs/enlaces y entrega de correo con prueba autorizada y resultado real.
4. Rendimiento de producción medido y calidad de imágenes a densidades adecuadas;
   no confundir nitidez de captura del navegador con calidad del activo original.
5. Revisión SEO/accesibilidad, build y comparación pública; commit recuperable y
   publicación solo con puertas y permisos disponibles, seguida de verificación.

El CMS conserva su trabajo pendiente sin mezclarlo con este carril prioritario.

## Estado de permisos · 13 septiembre

La escritura en Git vuelve a estar autorizada por el entorno. Este informe se
consolida como evidencia parcial, no como corrección ni aprobación de publicación.
La denegación del navegador local no ha sido revocada. Ningún resultado histórico
anterior se presenta como una nueva comprobación de producción del día 13.
