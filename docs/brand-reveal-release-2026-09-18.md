# Marca Framer desplegable — 18 septiembre 2026

## Autoridad y alcance

Manuel pide replicar el logotipo completo de sus referencias Framer: M / G / LL / A, revelado progresivo hacia la derecha al hover desktop. Letras neutras (blanco dark, negro light), solo plano derecho de M con degradado animado. Incluye el fallo confirmado del clic en la marca. Base recuperable `50b5209`, implementación anterior `3882643`, producción anterior `dpl_2WzccPTYXvSEFKPXxrupLGTaZbLA`.

Referencias: fotografías propias 694d631f/1,3,5 y M aprobada e77d963c/3. Reconstrucción vectorial de los contornos a partir de imágenes, no exportación del archivo original de Framer. No se altera el orbe, Hero, CV, CMS ni geometría del resto de navbar.

## Implementación

- `BrandSignature.tsx` y CSS propio: M y tres módulos G/LL/A, trazados geométricos. Sin dependencias nuevas.
- Hover de puntero preciso a partir de 768px y foco visible: revelado 480ms, letras escalonadas 100ms. Sin reflujo de enlaces de navegación. Se mantiene el nombre textual de escritorio en reposo donde ya aparecía.
- Plano derecho M: cian/azul/violeta con leve rosa; movimiento 3,6s solo durante hover/foco. Plano izquierdo y otras letras blanco/negro. Móvil: solo M, sin animación del degradado.
- Movimiento reducido: revelado inmediato, degradado estático. Enlace con nombre accesible original, SVG decorativos.
- `onNavigate`: conserva navegación a `/` desde otras páginas y clic modificado; en la misma home cierra menú y vuelve a scrollY0. No depende del mantenimiento de scroll de Next Link.
- Favicon SVG adaptado al esquema de color del navegador; ICO de respaldo regenerado 16/32/48, metadata versionada. El esquema del navegador y el selector manual del sitio pueden diferir.

## Evidencias

- RED navegador sobre producción anterior: scrollY400 permanece400 al pulsar M; prueba falla (69a39f). Desde Sobre mí sí volvía a home.
- RED unitario: no había firma vectorial ni módulos de letras (949e2b).
- GREEN: 280 pruebas /45 archivos, ESLint focal, build30páginas y tipos correctos. Guards Hero/responsive/frontera pública PASS; presupuesto público sin incidencias, baseline intacta.
- `verify-brand-mark.mjs`: SVG y fotogramas ICO coinciden16/32/48; plano neutro, color y corte transparente correctos.
- `verify-brand-navigation.mjs`: GREEN retorno arriba en misma ruta y retorno desde Sobre mí.
- `verify-brand-reveal.mjs`: verifica temas, apertura/cierre hover, posiciones de navegación, teclado real Tab/Shift+Tab, movimiento reducido, ausencia de animación móvil/errores/overflow. Evidencia visual en `.audit/brand-reveal`.

Navegador local: seis escenarios 390/768/1280 dark/light PASS, incluidos teclado real y movimiento reducido. Capturas dark móvil, hover768/1280 dark y hover1280 light inspeccionadas. No equivale a prueba en móvil físico. Publicación pendiente; aceptación estética final: Manuel.
