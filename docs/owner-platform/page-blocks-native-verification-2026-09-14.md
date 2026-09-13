# Bloques de página: cobertura nativa ampliada

Fecha: 2026-09-14, Madrid. Base de trabajo 244326b. Solo pruebas; no cambios
de esquema, componentes, publicación ni diseño público.

## Carencia y alcance

Pages registra Portada, Texto enriquecido, Galería de proyectos, Imagen y
Sección especial. El ensayo nativo ya ejercitaba los tres primeros tipos
hero/richText/media, pero no projectGrid/customFeature. Se añade una cuarta
página por viewport mediante el formulario real, después de crear el proyecto
sintético existente. No se prepara esta página con escrituras API.

La nueva comprobación conserva la relación con el proyecto, su título/resumen
y portada decodificada en preview, enlace al editor y tipo contact-panel tras
guardar y recargar. Compara el proyecto original completo para comprobar que
seleccionarlo no lo edita. Mantiene el aviso explícito de que la composición
especial no está conectada a la vista editorial; no inventa un panel funcional.

El runner devuelve la nueva página junto con las anteriores y compara las
ocho páginas después del reinicio real de la aplicación. No es solo una
comprobación de render estático ni una aserción sobre el texto del código.

## Verificación

- Sintaxis del helper: salida 0, 310792.
- ESLint de los cuatro archivos modificados: salida 0, 74841 / 893a27.
- `npm run test:production:editor`: 96511, salida 0, b566a8. Creación/selección,
  guardado, recarga y preview pasan a 390/1280. Los recorridos anteriores siguen
  activos. Persistencia de ocho páginas, dos marcas, dos encuadres, dos artículos
  y dos proyectos tras reinicio; borradores/historial privados ante anónimos.
- App/clúster cerrados y raíz sintética retirada por el runner.

Entorno: checkout Linux 230278e con dependencias recién instaladas, overlay
unitario 2be8ed5 y estos cuatro archivos de pruebas. No se presenta como un
checkout exacto del commit final. PostgreSQL y objetos sintéticos, Chromium
emulado; no navegador físico, staging ni producción. No se repiten ni se
atribuyen a este incremento las baterías completas previas.

## Límites pendientes

Hay al menos un recorrido nativo para cada tipo de bloque de Pages, pero no
todas sus combinaciones, entradas inválidas, listas extensas o funcionalidades
especiales. La composición propia de customFeature sigue pendiente de conexión.
La usabilidad humana y los nuevos controles visuales requieren revisar el
editor con Manuel. No se declara resuelta la intermitencia histórica de papelera.
