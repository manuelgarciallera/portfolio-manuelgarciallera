# Ajuste leve del giro del CTA

Petición expresa de Manuel: un poquito más rápido, misma dirección y aspecto. Reserva Hub `a4b3c56d-3e82-4864-90e4-d01b1a32ccdc`, base `7ef6451`.

Solo cambia la duración de las animaciones sincronizadas del borde y halo: entrada4,8→4,4s; hover8→7,3s. Velocidad aproximadamente9% mayor. No cambia número de vueltas, dirección35→395grados, colores, máscara de cápsula, difusión, tamaño o movimiento reducido. No modifica el orbe ni su variante experimental.

Prueba `scripts/verify-hero-cta-border.mjs` ampliada para comprobar duraciones CSS reales, además de movimiento, sincronización, ambos temas, cristal, foco, enlace y geometría en390/1280. Verificación de publicación se registrará después de READY y prueba LIVE.

Publicado: `2e58d8b` commit/push, CI35151600393 SUCCESS. Preview dpl_9mDYPTKPHW37QNhAf5tgMAqttSSY y producción dpl_5gx6t7iz7uJXnRSGHyqKygLr6Uwe READY; alias manuelgarciallera.com verificado. Prueba CTA LIVE PASS cuatro combinaciones390/1280 y claro/oscuro, incluyendo duraciones4,4/7,3s, sincronización y movimiento reducido. Logs errores últimos5min sin entradas. No nueva medición física de batería. Reversión disponible en versión pública anterior9541b07/dpl_E6gTMxSma2ent6swtpYxzjFvgVFs.
