# Revisión desktop y móvil del consentimiento

Petición de Manuel: adaptación cuidada del aviso y sus preferencias. Base 4bcc32b; alcance CSS y pruebas, sin modificar consentimiento, proveedores ni publicar.

## Correcciones comprobables

- Enlace de privacidad: área táctil de al menos 44px de alto. Regresión inicial reproducida a 320×568 (705d57).
- Botones: columnas que se adaptan al ancho disponible y al tamaño de letra. Con texto al 200%, el diseño anterior mantenía dos columnas y rompía palabras; fallo reproducido a 390×844 (6c5c56). Ahora se apilan conservando equivalencia visual.
- Sin nuevas dependencias ni cambios de JavaScript de producción. Se conserva el diseño existente, el scroll interno y los estados de foco.

## Pruebas

Script `scripts/verify-analytics-responsive.mjs`, contra compilación Next local de producción, con 12 configuraciones y dos temas: 320×568, 360×640, 390×844, 430×932, 568×320, 844×390, 768×1024, 1024×768, 1440×900, 1920×1080; además texto al 200% a 390×844 y 720×450. Verifica límites del panel, desbordamientos, áreas táctiles, igualdad de botones, detalles, guardar mediante teclado, reabrir, Escape y ausencia de tráfico analítico en localhost. Capturas en `.audit/analytics-consent-responsive/`.

Es emulación Chromium, no prueba en dispositivos físicos ni certificación de compatibilidad universal. Texto aumentado al 200% no equivale a haber probado todos los modos de zoom de cada navegador. Resultado completo de ejecución registrado en REGISTRO.

Build de producción: exit0, 30 páginas, tipos correctos. Ensayo aislado de consentimiento: PASS a cuatro anchuras. CSS aislado pasa de 994 a 1024 bytes gzip (+30 B); JS del bundle público sin cambio (privacidad 75.432 B raw, 26.281 B gzip). El exceso raw de privacidad detectado en la integración anterior permanece; no se cambió baseline.

No publicado. Pendientes previos de configuración de cuentas, retención y presupuesto siguen documentados en `analytics-consent-integration-2026-09-16.md`.
