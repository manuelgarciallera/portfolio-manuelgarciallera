# Hero móvil: titular y CTA según captura — 16/09/2026

Manuel pide implementar y publicar el titular mayor dentro de la caja marcada, con más interlineado y CTA separado en la zona inferior señalada. Base67cec73. Reserva Hub8ea0e838. Cambio acotado al CSS móvil; sin cambios de desktop, esfera, cookies, contenido o dependencias.

- Titular arriba, desde17svh con límites120–160px; fuente14vw limitada por altura7,6svh y máximo64px; interlineado1,04 frente a0,95.
- Bloque de100svh como mínimo, distribución entre titular y CTA, separación mínima32px. CTA cerca del borde inferior con margen48–72px. Esfera/nombre siguen al bajar. La altura mínima permite crecer ante ajustes de accesibilidad, sin recortar a una altura fija.
- RED real de la prueba antes del CSS: interlineado insuficiente (c2325f). GREEN final: ocho tamaños en navegador de desarrollo, 320×568 a767×1024 y desktop1280×720 (f3ab79). Sin desbordamientos ni recortes, separación y primera pantalla verificadas; cero solicitudes analíticas sin consentimiento.
- Referencia390×712: titular desde121px hasta514,89px, fuente54,112px/interlineado56,2765px; CTA611,86–655,05px; escena desde712px (94beaa). Captura revisada: corresponde a la caja y círculo del usuario, aproximadamente20% más de fuente frente a44,85px anterior. No prueba física de su dispositivo.
- 320×568: titular120–434,23, CTA476,81–520, escena568 (1e9aa0). Desktop conserva hero720/CTA549,17.
- Build final30páginas/tipos PASS33e778. Lint completo, tipografía8perfiles, menú móvil y estructura hero PASSc93949; lint del test12d411. Solo CSS, no nueva lógica React.
- Bundle fresco PASS40bef4, sin crecimiento JS: home138318raw/50545gzip; privacidad65476raw/22437gzip. Baseline intacta.

Siguiente: commit/push explícitos y promoción del deployment correspondiente; verificar mismo guion en URL original. Rollback runtime previo d586393, deployment dpl_4asVSijC1DZQzcUTa3zGkWfw4TB8. No declarar publicación hasta verificar dominio.
