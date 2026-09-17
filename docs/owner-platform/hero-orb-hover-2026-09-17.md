# Hover del orbe · 17/09/2026

Manuel aprueba reacción suave al pasar cursor desktop, pulsación más intensa, salida gradual y móvil intacto. Base40b6574; reserva8ebf35a7.

Implementación: reutiliza pressPoint/pressStrength del shader existente. Ratón y capacidad any-hover, solo layout no compacto; entrada180ms a intensidad0,35, salida700ms. Click sigue1 con recuperación previa. Limpieza pointerleave/blur/ocultación y desmontaje; sin otro RAF, estado React por evento, dependencias, shader, resolución o CSS nuevos. Se mantiene lectura actual de coordenadas en eventos para scroll, no lecturas de layout por frame.

RED hover público81347c; GREEN Chromiumc9c4db y Firefox escritorio924a02: pasar sin pulsar, quieto, seguircursor, click más intenso, salir y blur; compacto nohover. Firefox escritorio no equivale a Android.

274unitarias/43 PASS384693; lint/diff917d80; build30/tipos18f899; presupuesto original38ca37 PASS. Matriz táctil/temas en curso antes de publicación. No declaración de FPS físico. Siguiente Codex terminar controles, commit/push y CI/READY/LIVE. Reversión runtime b74ad43.
