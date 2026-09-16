# Orbe: continuidad durante el scroll

Petición directa de Manuel: no congelar el orbe al desplazar hacia arriba o abajo. Base `9c54fb2`; reserva Hub `5465863c-8b76-41e4-abd7-2e18ba652090`.

## Causa y cambio

El listener de scroll móvil cancelaba RAF y reanudaba tras 180 ms de quietud. Era una optimización deliberada anterior, ahora rechazada por el usuario. Se retira ese listener, su temporizador y su bloqueo; no se altera shader, resolución, paleta, escala, composición ni deformación táctil. Se conservan el límite de 30 dibujos/s, pausa fuera de pantalla/pestaña oculta y alternativa estática de movimiento reducido.

## Evidencia actual

- RED en dominio público: `verify-orb-touch.mjs` falla por falta de dibujos durante desplazamiento real arriba/abajo (`28e55b`).
- GREEN local dev y build de producción: móvil390/desktop1280, contacto sostenido, impulso finito sin evento de liberación y scroll continuo (`509eca`, `78b3a8`).
- Build de producción: 30 rutas, tipos correctos (`19bf5b`). Unitarias274/43 (`375fae`); lint focal/diff correctos (`eb177c`).
- Presupuesto público: inicio138706 bytes raw /50639 gzip, sin errores (`c7395f`); baseline intacta.
- Checkpoint protegido `0f0adf686b2752e23c25d224f8c60815b10fd451` comprobado.
- Control compilado completo390/1280 claro/oscuro: animación, límite de resolución, cero dibujos fuera de vista, movimiento reducido y pérdida de contexto pasan (`14cc4c`).

No equivale a demostrar ausencia de lag en un teléfono físico. El shader conserva un coste GPU real; el diagnóstico previo en SwiftShader no se puede presentar como FPS del móvil. Se ha priorizado continuidad visual solicitada sobre congelación durante scroll. Control de visibilidad, publicación y comprobación LIVE pendientes al crear este recibo.

## Continuación nocturna

## Publicación verificada

CI35160655559 validate+owner SUCCESS (`38e913`). Producción `dpl_8SSnduDukgszDw9F6Y797mbeBo2p` READY con alias manuelgarciallera.com (`5057f6`). Prueba LIVE390/1280 pasa (`39423e`): contacto no congela, impulso decae y el tiempo del shader avanza durante desplazamiento arriba/abajo. Consulta logs error5min sin entradas (`0d4037`). Servidor de prueba3020 detenido,3015/3017 conservados. La comprobación de continuidad queda cerrada; rendimiento físico y optimización diferencial siguen como siguiente control, sin declarar coste nulo ni lag eliminado universalmente.

Rollback: runtime anterior `a160cba`, producción `dpl_HZybwdW1iQWuXUmwHpLM28MAAqbS` (recupera también la pausa durante scroll).

Commit runtime `e6ea37e` subido. Repetición compilada con tiempo real del shader avanzando durante scroll pasa (`93c921`); prueba móvil completa320/390/430 oscuro y390 claro, geometría/barridos/toque/scroll, pasa (`a9ddaa`).

Automatización existente `portfolio-y-cms-ventana-de-ocho-horas` reactivada hasta17/09/2026 08:50 Europe/Madrid, sin duplicar tareas. Primero control del orbe, después CMS si pasa los controles disponibles. El objetivo de la app permanece pausado: la herramienta no permite reanudarlo; el mecanismo activado es el seguimiento de esta misma tarea. Sin garantía de ejecución continua ni autorización nueva para publicar CMS/gastar.
