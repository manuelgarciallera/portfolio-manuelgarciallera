# Ritmo del degradado H1

Manuel solicita barrido algo más lento y repetición antes. Base44b1425, reserva Hub cee37299. Solo `redesign.css`: ciclo20→18s y fin del barrido7→10%, duración activa1,4→1,8s; pausa16,2s. Aparición inmediata, diagonal135grados, paleta, composición, CTA y movimiento reducido conservados. Sin cambios de orbe/CMS.

`verify-hero-type-sweep.mjs` comprueba duración, continuidad del barrido hasta1,8s, reposo y repetición18s con muestreo de la animación real, contraste, geometría y movimiento reducido en390/1280 y ambos temas. La publicación se distinguirá de la prueba local.

Publicado y verificado: commit/push `b9dc91e`, CI35152227629 SUCCESS; producción dpl_DmDhwTZ3b27NXwMjMzT8KYvR7cE6 READY y alias manuelgarciallera.com. Prueba local y LIVE cuatro combinaciones390/1280 claro/oscuro PASS. Logs error5min sin entradas. Reversión disponible en2e58d8b / dpl_5gx6t7iz7uJXnRSGHyqKygLr6Uwe. Sin nueva medición de batería física ni cambios de dependencias.
