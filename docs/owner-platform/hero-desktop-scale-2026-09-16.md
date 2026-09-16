# Hero · escala desktop y ritmo del titular

16/09/2026 · Codex · solicitud y continuación autónoma autorizadas por Manuel. Base `8b49e64`.

## Implementación

- Desktop: tamaño del orbe vinculado al mismo token fluido que el H1; diámetro estático 3,2 renglones y escena WebGL ampliada proporcionalmente. Elevado 0,6 renglones para encajar con las filas segunda a cuarta de la referencia.
- Nombre HTML correcto, en una línea desde 1180px y tres por debajo hasta el corte móvil. Móvil conserva composición, geometría y tamaño aceptados.
- H1: color centrado desde primer fotograma, recorrido 1,4s y ciclo 20s; movimiento reducido sigue mostrando texto sólido.
- Sin nuevas dependencias ni cambio de CTA, consentimiento, CMS runtime o diseño del resto de secciones.

## Evidencia local

- RED barrido `308744`: posición inicial antigua60 frente al objetivo50. GREEN cuatro combinaciones tamaño/tema `330e72`; temporización, recurrencia, contraste y movimiento reducido.
- RED escala `0bb77c`: orbe antiguo121px ante H1 49,92px. GREEN seis tamaños `e9bacc` (390–1920), nombre una/tres líneas, móvil y viewport. Posteriormente elevado0,6em; prueba viewport final siete tamaños `6fb49b` PASS.
- Escena WebGL1280×720 inspeccionada visualmente (`a35cfb`): orbe en torno a y220–443, nombre en línea debajo, CTA íntegro. Alternativa estática no se usa como prueba exclusiva del canvas.
- Transparencia: ocho transiciones desktop/móvil, normal/reducido PASS `2780c0` (salida previa `c5c7e8`).
- Unitarias279/43 `97c76d`, lint focal `8a1ff5`, build público30rutas/tipos `488d0c`, presupuesto `71b674` PASS: home138731raw/50612gzip; sin aumento JS inicial.
- Ensayo inicial simultáneo del barrido agotó30s de navegación; repetición completa pasó. El final de interpolación devolvió1,4e-14: test usa tolerancia0,001, sin cambio visual para ocultarlo.

## Pendientes separados

- Orbe orgánico: prototipo aislado en `experiments/hero-organic/index.html`, no importado ni publicado en la web. Debe pasar revisión visual y rendimiento antes de decidir integración.
- Candidato histórico encontrado: `src/features/portfolio/three/HeroOrbCanvas.jsx`, `LiquidMesh` deformado y rotación; no podemos afirmar que sea exactamente el ente recordado por Manuel. No se ha restaurado sobre la web pública.
- CMS: arrastre, cruceta y guías registrados como CMS-LAYOUT-01 en `visual-effects-backlog-2026-09-16.md`; propuesta pendiente de diseño/prueba editorial, no implementación.

Publicación y verificación live se registrarán después del despliegue. Reversión pública disponible en `fcf979e` / dpl_J6FwFV3vmEGbTbig5CuGp9iJE4ug. Reserva Hub8bd7f858. Siguiente responsable Codex para publicación y prueba; Manuel para revisión estética al volver.
