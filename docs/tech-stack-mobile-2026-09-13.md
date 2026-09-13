# Stack móvil fuera del visor

Solicitud de Manuel: iconos ocultos por el bloque de imagen en móvil.
Base: de6095e. Cambio acotado a CaseCard y estilos móviles.

La copia de tarjeta es absoluta, tiene altura calculada como 43% del visor y
se oculta en estado slide. TechStack era descendiente de esa copia, de modo que
envolver filas no le proporciona espacio propio y tampoco evita su ocultación.

Se añade una presentación móvil del mismo stack como footer normal del artículo,
fuera del visor. A 767px o menos se oculta la presentación interior y se muestra
el footer con filas y nombres sin partir. A partir de 768px el footer no se muestra
y se conserva la composición anterior. Sin dependencias ni publicación.

Prueba estructural antes del cambio: 3 fallos/7 pasan (970f67), al faltar el footer
externo con las cinco, seis o siete tecnologías. Después: 227/227 en 37 archivos
(227efe). Estas pruebas comprueban contenido y ubicación en el HTML, no geometría
del navegador. La comprobación visual local sigue pendiente de permiso; no se
afirma corrección verificada en producción ni en un dispositivo físico.

Siguiente: permitir navegador local, revisar 320/390/767 y escritorio, verificar
ambos estados del carrusel y publicar solo tras las puertas aplicables.

## Comprobación previa a sincronizar GitHub

Fetch del 13 de septiembre: remoto 5153661, local b9a8b3a, 124 commits por
delante y cero por detrás. El único delta público está en CaseCard y su CSS/test;
los restantes commits pertenecen al CMS/documentación. Seis archivos del arnés
CMS siguen sin commit y no se mezclan con la corrección pública.

`check:all` completo pasa (bbffca): 227 unitarias, 14 guardas, tipos, lint,
build de 29 páginas, presupuesto de bundle de 10 rutas y auditoría de dependencias
de producción sin vulnerabilidades reportadas. La primera ejecución falló por
`--use-system-ca` heredado en NODE_OPTIONS; se retiró solo esa opción del proceso
temporal, restaurándola después, sin desactivar validación TLS ni cambiar archivos.

Esto no sustituye la comprobación visual pendiente. No push ni despliegue en esta
comprobación. El conector de Vercel devuelve 404 al consultar el proyecto localmente
enlazado; no se acredita configuración actual de publicación automática.
