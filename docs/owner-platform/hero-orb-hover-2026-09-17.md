# Hover del orbe · 17/09/2026

Manuel aprueba reacción suave al pasar cursor desktop, pulsación más intensa, salida gradual y móvil intacto. Base40b6574; reserva8ebf35a7.

Implementación: reutiliza pressPoint/pressStrength del shader existente. Ratón y capacidad any-hover, solo layout no compacto; entrada180ms a intensidad0,35, salida700ms. Click sigue1 con recuperación previa. Limpieza pointerleave/blur/ocultación y desmontaje; sin otro RAF, estado React por evento, dependencias, shader, resolución o CSS nuevos. Se mantiene lectura actual de coordenadas en eventos para scroll, no lecturas de layout por frame.

RED hover público81347c; GREEN Chromiumc9c4db y Firefox escritorio924a02: pasar sin pulsar, quieto, seguircursor, click más intenso, salir y blur; compacto nohover. Firefox escritorio no equivale a Android.

274unitarias/43 PASS384693; lint/diff917d80; build30/tipos18f899; presupuesto original38ca37 PASS. Tacto sostenido/release/cancel/blur/scroll390 y1280 PASS30c87c. MatrizWebGL ambos temas y formatos, resolución limitada, movimiento, fuera de vista, reduced-motion y context-loss PASS540a98. No declaración de FPS físico.

Commit/push32c669b confirmado44a38a. Preview8cYzernLa7mb82L7sVDaVLWn32LM READY con SHA correcto65037c; CI35193896569 completoSUCCESSf1f52d. Publicado en dpl_A2vKWCNNqpeG5pNauD7pE8BNncx6 READY y dominiooriginald4c115. Servidor3020detenido39c669. Logs5minsinentradascc1c1b; no garantía universal de errorescliente. Reversión runtime b74ad43.

LIVE Chromium y Firefox escritorio pasan todos los casos hover/click/salida/blur y exclusión en formato compacto (`fc550f`). Reserva8ebf35a7 liberada; siguienteManuel revisión subjetiva de intensidad, sin decisión nueva ni procesos propios pendientes.
