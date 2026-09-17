# Luz interna del orbe · 17/09/2026

Manuel rechaza las burbujas externas y aprueba una luz azul/cian/violeta que atraviesa el fluido, sigue el cursor con ligero retraso y deja una estela breve. Solo desktop, conservando pulsación y móvil. Base a06b0d3; reserva Hub b4ee82fd.

HeroOrbCanvas deja de importar el overlay de burbujas y reutiliza el reloj WebGL existente para la luz (seguimiento 120 ms, estela 280 ms, entrada 160 ms/salida 220 ms). El shader ilumina únicamente la superficie del cuerpo, con distorsión por refracción y corrientes internas, sin alterar alfa, geometría, gotas ni bucle de ray-marching. Sin dependencias nuevas, otro canvas ni otro RAF. Puntero fino/hover/desktop; tacto y movimiento reducido excluidos. Prototipo y código de burbujas conservados sin carga pública; su verificador pasa al directorio histórico del experimento.

TDD navegador RED b28793 contra versión pública sin luz. Primer candidato falla salida0678a0; diagnóstico9fbd8a muestra fuerza0,026 tras1,5s: cap de paso temporal prolongaba la estela en render lento. Se cambia solo damping a tiempo real, sin tocar reloj del fluido. Pruebas finales pendientes de registrar.

Comparación real de shader b499c6, mismo fotograma384px en oscuro/claro: delta máximo en reposo0 y delta alfa0, luz cambia52761/35953 canales. Inspección de ambos PNG realizada. Medianas base101/103,7ms, nueva reposo102,6/105,5ms, activa104/104ms en GPU software: incremento agregado aproximado1,7% reposo/1,6% activa; no es FPS de dispositivo físico. Presupuesto público original PASS547e58 sin cambiar baseline. Primer build30/tipos8e3aaa y277unitarias/lint e29131 PASS; repetir tras corrección temporal.

Recuperación: f38e1a2 conserva burbujas; 32c669b conserva orbe sin burbujas ni nueva luz. No cambios de layout, contenido ni CMS.

Verificación tras corregir damping: build30/tipos b57bbb PASS; 277unitarias/lint46bc21 PASS; presupuesto originalf0f14e PASS. Chromium94aba8 y Firefox8e1784 PASS cursor/seguimiento/salida a0/click continuo/móvil sin luz/reduced-motion. Hover baseb40ff3 PASS. Sin recursos externos nuevos ni métricas físicas inferidas.
