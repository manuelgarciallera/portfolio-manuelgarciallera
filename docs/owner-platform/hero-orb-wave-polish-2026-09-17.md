# Orbe: ondas de color, silueta y composición móvil

Autorización Manuel: integrar la variante azul/violeta aprobada, corregir dientes de sierra y ajustar el croquis móvil. Base 679b70e; runtime anterior 412f3f3 conservado en Git. Reserva Hub 62ad76de-5c1f-4a64-9e9b-334330584480. El laboratorio original no se modifica.

## Implementación

- La silueta ray-marched tenía alfa binaria: 0 píxeles intermedios a 384 px. Activar MSAA del cuadrilátero no resolvería el borde calculado dentro del fragment shader.
- Cobertura subpíxel aproximada a partir de la distancia mínima del rayo respecto al tamaño de píxel. Se suaviza exclusivamente el contorno; no filtro CSS, blur ni múltiples rayos por píxel. Se conserva presupuesto 64 pasos y buffer móvil máximo 384 px.
- Paleta del prototipo a7d64ed: corrientes azul, cian, violeta y rosa tenue. No física de fluidos real.
- Móvil: zoom 2,35 → 2,5; escena 24 px más arriba; nombre 5,6 → 6 cqi, máximo 28 px, una línea; separación reducida usando margen transparente inferior. H1 y CTA no cambian. Desktop conserva geometría.
- Cuatro fallback nuevos `hero-organic-waves-*.png`, transparentes, con la misma paleta y escala. Imágenes azules anteriores preservadas.
- Pausa durante gesto/inercia, fuera de pantalla y movimiento reducido conservada.

## Evidencia

`verify-orb-edge.mjs`: RED d82ab1 (0 píxeles con alfa intermedia), GREEN 78e231: 868/805/928 píxeles de cobertura parcial en tres fases; >54.000 píxeles opacos y >89.000 transparentes. Captura inspeccionada: contorno graduado e interior definido. No es una garantía de resolución infinita al ampliar con pinch.

Prueba móvil local cuatro escenarios (320/390/430 y claro) PASS 74e1a1: texto una línea, separación del líquido, barridos y pausa/reanudación durante desplazamiento real de scrollY. Captura 390 oscuro inspeccionada. Pruebas Chromium emuladas, no FPS del teléfono físico.

ESLint focal y 274 tests/43 archivos PASS391e34. Compilación aislada 30 rutas y TypeScript PASS935e17. Bundle inicial 138.706 bytes / 50.638 gzip, sin errores de presupuesto (3f48af); sin dependencias nuevas. La primera orden para arrancar el build de prueba fue rechazada por el guard de ruta de configuración; se arrancó después mediante configuración standalone, sin cambiar ese guard.

Responsive 390–1920 PASS6ed9ce: H1/CTA conservados, nombre sin overflow, desktop una o tres líneas según ancho. Orbe compilado 390/1280 ambos temas PASS1dbf53: animación, máximo de buffer, pausa fuera de vista, fallback reducido y pérdida de contexto. Capturas claro/oscuro revisadas.

Publicado: commit/push `25cc2db577510ffaf348d3748135b7a7b3da001d`, CI35157281233 SUCCESS (validate + owner). Preview dpl_GwQUWSitME7vjHY5umQoRbU1AwzL, promoción a producción **dpl_H7Mgw4Xub7mfHSixzgFj7pFLFoqu**, READY y alias manuelgarciallera.com verificados0072cd. Logs de error5min vacíos e7f791. Reversión: runtime anterior412f3f3/dpl_8hhRRTBh2S8Xq9BoPUSJncuLxzid. Servidor propio de prueba3020 detenido;3015 y laboratorio3017 preservados.

LIVE sobre dominio principal: `verify-mobile-hero-polish.mjs` cuatro combinaciones PASSf90440, exit0; geometría, texto, barridos y pausa/reanudación del orbe durante scroll comprobados. Capturas actualizadas.

Interacción reactiva al dedo sigue como siguiente mejora; este lote no la implementa. La suavidad física en el teléfono y ampliaciones extremas requieren revisión de Manuel; no afirmar calidad vectorial infinita ni ausencia universal de lag.
