# Segunda página y editor compacto: recorrido comprobado

15/09/2026 · Codex · preparación de segunda web, no sitio publicado.

## Base y motivo

Se amplía la cobertura nativa anterior390/1280 a320/768, sin programar otro
editor ni repetir la misma matriz. Checkout aislado61aead7 más únicamente el
harness HTTP de6ea1420. Dependencias Linux reutilizadas con lock idéntico como
en el recibo discovery; build nuevo con configuración sintética y PostgreSQL16.

Comando en el checkout owner aislado:

```sh
OWNER_POSTGRES_BIN=/usr/lib/postgresql/16/bin OWNER_SECOND_PAGE_SCREENSHOTS=1 node scripts/test-production-http.mjs --browser-editor --compact-viewports
```

Sesión32740, salida0 (`692df6`). Ningún token real, correo, cliente o despliegue.

## Qué quedó demostrado

- Segunda página escrita mediante formulario nativo: Portada y Texto enriquecido,
  título, marca distinta, negrita/cursiva, guardar, deshacer, guardar y recargar.
  La marca se prepara mediante API como fixture, no se afirma creación visual
  completa de esa marca en este recorrido.
- Preview con fondo crema y encabezado serif; el documento original no cambia.
- Cancelar salida mantiene lo escrito; descarte explícito conserva lo guardado.
- Subida/encuadre, receta móvil independiente, imagen y preview; original intacto.
- Papelera y restauración de borrador; captura de versión y revisión/preflight
  de publicación sin publicar la página.
- Artículos y proyectos creados/editados mediante controles nativos; página de
  galería conserva relación, portada decodificada y aviso de módulo especial
  todavía no conectado.
- Ocho páginas, dos marcas, dos encuadres, dos artículos y dos proyectos
  conservados tras reinicio real Next. Borradores e historial privados.
- Discovery403/400/413/503 mantiene no-store; readiness no se convierte en listo.
- App/clúster y datos sintéticos cerrados por el runner; no hay sesiones QA activas.

## Revisión de capturas

Capturas nuevas fechadas06:36–06:37 UTC, inspeccionadas por Codex:
`.audit/second-page-320-2026-09-15.png` y
`.audit/second-page-768-2026-09-15.png`. Son evidencia local sintética, no assets
del producto ni imágenes del portfolio.

No se observan solapamientos en esas dos vistas de la segunda página. La vista
explica que es privada y que no publica contenido. El selector indica Desktop
por defecto incluso en viewport estrecho, acompañado del texto de ajuste al
espacio disponible: no interpretar esa etiqueta como el tamaño físico probado.

El resultado es deliberadamente una preview editorial básica. No demuestra el
acabado comercial, las animaciones públicas ni la facilidad de uso para Manuel.

## Recorrido manual preparado para el portátil

1. Entrar en CMS local de prueba y crear una página como borrador.
2. Añadir Portada y Texto, escribir contenido propio de demostración y guardar.
3. Seleccionar una marca de prueba; comprobar tipografía/colores en preview.
4. Reordenar, guardar y recargar; deshacer una edición y recuperarla.
5. Comprobar que la primera página sigue intacta y localizar versión anterior.

Registrar pasos sin ayuda, dudas y errores. No usar datos reales de clientes.
Todavía faltan catálogo visual de temas, controles de estilo aprobados, destino
de publicación/reversión, staging y prueba humana. No equiparar segunda página
en el mismo CMS owner con segunda instalación, aislamiento de clientes o web
comercial independiente. La siguiente decisión de UI requiere mostrar el editor
actual, no sustituirlo durante la ausencia de Manuel.
