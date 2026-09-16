# Hero móvil: titular y CTA según captura — 16/09/2026

Manuel pide implementar y publicar el titular mayor dentro de la caja marcada, con más interlineado y CTA separado en la zona inferior señalada. Base67cec73. Reserva Hub8ea0e838. Cambio acotado al CSS móvil; sin cambios de desktop, esfera, cookies, contenido o dependencias.

- Titular arriba, desde17svh con límites120–160px; fuente14vw limitada por altura7,6svh y máximo64px; interlineado1,04 frente a0,95.
- Bloque de100svh como mínimo, distribución entre titular y CTA, separación mínima32px. CTA cerca del borde inferior con margen48–72px. Esfera/nombre siguen al bajar. La altura mínima permite crecer ante ajustes de accesibilidad, sin recortar a una altura fija.
- RED real de la prueba antes del CSS: interlineado insuficiente (c2325f). GREEN final: ocho tamaños en navegador de desarrollo, 320×568 a767×1024 y desktop1280×720 (f3ab79). Sin desbordamientos ni recortes, separación y primera pantalla verificadas; cero solicitudes analíticas sin consentimiento.
- Referencia390×712: titular desde121px hasta514,89px, fuente54,112px/interlineado56,2765px; CTA611,86–655,05px; escena desde712px (94beaa). Captura revisada: corresponde a la caja y círculo del usuario, aproximadamente20% más de fuente frente a44,85px anterior. No prueba física de su dispositivo.
- 320×568: titular120–434,23, CTA476,81–520, escena568 (1e9aa0). Desktop conserva hero720/CTA549,17.
- Build final30páginas/tipos PASS33e778. Lint completo, tipografía8perfiles, menú móvil y estructura hero PASSc93949; lint del test12d411. Solo CSS, no nueva lógica React.
- Bundle fresco PASS40bef4, sin crecimiento JS: home138318raw/50545gzip; privacidad65476raw/22437gzip. Baseline intacta.

## Publicado y comprobado

- Commit/push c1b8cfe344975e09d21e509e73576a098a82fa95 (3394f6). Preview dpl_E4wrN6qWrT76epymP3tN96EVPkwf READY.
- Promoción solicitada por Manuel ejecutada4f72bb. Producción **dpl_7qwUUJXzaVbgYoTEf5NJUAr5Ej5b**, READY, alias **https://manuelgarciallera.com** verificado7ab144. Publicación16:15CEST.
- Mismo guion contra el dominio real: ocho tamaños PASS228bdc; referencia390×712 igual a las medidas locales, captura revisada. Cero errores JS, desbordamientos y solicitudes analíticas sin consentimiento en los escenarios. La primera consulta arrancó durante la transición del deployment y leyó el CSS anterior (fa5d3d); se repitió solo después de confirmar READY, sin cambiar código ni rebajar aserciones.
- GitHub Actions35107086427 SUCCESS, validate y owner (e2b826). Logs de errores del deployment últimos10min: sin entradas (bd2b12); drains no inspeccionados, no garantía universal.
- Hito móvil implementado, subido y publicado. Desktop y consentimiento intactos. No servidor nuevo ni automatización reactivada; cambios compartidos preservados.

Rollback runtime previo d586393, deployment dpl_4asVSijC1DZQzcUTa3zGkWfw4TB8. No ejecutado. Próximo: revisión visual de Manuel en su móvil, sin bloquear este cierre técnico.
