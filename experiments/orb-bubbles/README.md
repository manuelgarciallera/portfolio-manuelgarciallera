# Prueba local: burbujas cítricas

Experimento visual aprobado por Manuel, **no integrado ni publicado**. Usa el hero real desde un build local; ningún archivo de `src/` ni bundle público se modifica.

## Abrir

1. Compilar el portfolio con `PORTFOLIO_BUILD_DIR=.owner-verification-builds/release-proof` y `npm run build` si el build no existe o está desactualizado.
2. Con la misma variable, ejecutar `npm run start -- --port 3020`.
3. Ejecutar `node experiments/orb-bubbles/server.mjs`.
4. Abrir <http://127.0.0.1:3031>. Mover rápido el ratón sobre el orbe hacia el H1 o pulsar «Ver un gesto de ejemplo».

El proxy escucha únicamente loopback, admite GET/HEAD y solo sirve la portada/recursos y dos módulos explícitos del experimento. No transmite cookies ni habilita formularios/API. No añadir a las rutas de producción.

## Dirección visual y límites

- Cinco burbujas por ráfaga, máximo28; naranja/ámbar con aro fino, reflejo y halo leve.
- Umbral de velocidad0,7px/ms, siguiendo dirección del gesto, sin emitir al mover lento ni lejos del orbe.
- Vida1,9–2,55s; contacto con cajas de caracteres del H1 acelera disolución a300ms. Aproximación visual, no colisión exacta de glifos ni fluidos físicos.
- Canvas2D transparente que no recibe eventos; resolución limitada a1,5DPR. RAF solamente con partículas activas.
- Móvil, puntero grueso, movimiento reducido y documento oculto desactivados. Scroll/resize/blur limpian la capa; el orbe público mantiene su comportamiento normal.

## Verificación

`node --test experiments/orb-bubbles/bubbles.test.mjs`:3PASS, emisión/dirección/límite/disolución/limpieza. RED5a1c23 → GREEN7a54d9/a980ff.

`node experiments/orb-bubbles/verify.mjs`: prueba real de navegador desktop, móvil y movimiento reducido PASS968ba4/3e6dcb; canvas sin captura de eventos, emisión visible, desaparición, gesto real, limpieza al cambiar preferencia, sin errores JS. Instrumentación temporal reside solo en la prueba. El retraso de entrega del laboratorio motivó usar event.timeStamp y admitir muestras separadas hasta350ms manteniendo el umbral de velocidad; no acredita rendimiento físico.

Revisión visual pendiente de Manuel. Mantener como experimento hasta aprobación explícita de integración; no prometer coste cero. Basepública e8b97fe/32c669b intacta. Servidores3020 y3031 se dejan activos para esta revisión local.
